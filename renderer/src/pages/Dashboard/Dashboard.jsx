import { useEffect, useRef, useState } from 'react';
import { Chart } from 'chart.js/auto';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard/StatCard';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import { formatRp } from '../../utils/format';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [now, setNow] = useState(new Date());
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const result = await window.api.getDashboardData();
        setData(result);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    if (!data || !chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(chartRef.current.getContext('2d'), {
      type: 'line',
      data: {
        labels: data.chartLabels,
        datasets: [
          {
            label: 'Pendapatan',
            data: data.chartData,
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            borderWidth: 4,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#4f46e5',
            pointBorderWidth: 2,
            pointRadius: 5,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { borderDash: [5, 5], color: '#e2e8f0' } },
          x: { grid: { display: false } },
        },
      },
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [data]);

  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const recentOrdersColumns = [
    {
      key: 'invoice_number',
      label: 'No. Invoice',
      render: (row) => <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{row.invoice_number}</span>
    },
    {
      key: 'customer_name',
      label: 'Pelanggan',
      render: (row) => <b>{row.customer_name}</b>
    },
    {
      key: 'total_amount',
      label: 'Total Tagihan',
      render: (row) => formatRp(row.total_amount)
    },
    {
      key: 'payment_status',
      label: 'Status',
      headerStyle: { textAlign: 'center' },
      cellStyle: { textAlign: 'center' },
      render: (row) => (
        <StatusBadge variant={row.payment_status === 'Lunas' ? 'success' : 'danger'}>
          {row.payment_status}
        </StatusBadge>
      )
    }
  ];

  return (
    <div className="dash-wrapper">
      <div className="dash-header-section">
        <div className="dash-greeting">
          <h1>Halo, {user?.name || 'Kasir'}!</h1>
          <p>Sistem siap digunakan. Berikut ringkasan performa hari ini.</p>
        </div>
        <div className="dash-clock">
          <h2>{timeStr}</h2>
          <p>{dateStr}</p>
        </div>
      </div>

      <div className="grid-stats">
        <StatCard variant="omzet" icon="fas fa-wallet" label="Omzet Hari Ini" value={formatRp(data?.omzet)} trendIcon="fas fa-arrow-up" trendLabel="Penjualan Aktif" />
        <StatCard variant="laba" icon="fas fa-coins" label="Estimasi Laba" value={formatRp(data?.laba)} trendIcon="fas fa-chart-pie" trendLabel="Profit 30%" />
        <StatCard variant="transaksi" icon="fas fa-shopping-bag" label="Transaksi" value={`${data?.transaksi || 0} Struk`} trendIcon="fas fa-history" trendLabel="Real-time" />
        <StatCard variant="piutang" icon="fas fa-file-invoice-dollar" label="Piutang" value={formatRp(data?.piutang)} trendIcon="fas fa-exclamation-circle" trendLabel="Belum Lunas" />
      </div>

      <div className="main-grid">
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-chart-line" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', padding: '6px', borderRadius: '6px' }}></i>
              Grafik Performa Mingguan
            </h3>
            <select className="input-field" style={{ width: 'auto', padding: '5px 10px', fontSize: 11, margin: 0 }}>
              <option>7 Hari Terakhir</option>
              <option>30 Hari Terakhir</option>
            </select>
          </div>
          <div style={{ height: 300 }}>
            <canvas ref={chartRef}></canvas>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-fire" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '6px', borderRadius: '6px' }}></i>
              Produk Terlaris
            </h3>
          </div>
          <div className="list-modern">
            {!data ? (
              <p className="empty-note">Memuat data...</p>
            ) : data.topProducts.length === 0 ? (
              <p className="empty-note">Belum ada data penjualan.</p>
            ) : (
              data.topProducts.map((item, index) => (
                <div className="item-modern" key={item.name}>
                  <div className="item-info">
                    <div className="item-rank">{index + 1}</div>
                    <div className="item-text">
                      <b>{item.name}</b>
                      <span>Paling sering dipesan</span>
                    </div>
                  </div>
                  <b style={{ color: 'var(--primary)' }}>{item.sold}x</b>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="main-grid">
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-exchange-alt" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '6px', borderRadius: '6px' }}></i>
              Aktivitas Terakhir
            </h3>
            <Button variant="info" onClick={() => navigate('/orders')} style={{ padding: '6px 12px', fontSize: 11 }}>
              Lihat Semua
            </Button>
          </div>
          <Table 
            columns={recentOrdersColumns} 
            data={data?.recentOrders || []} 
            emptyText={!data ? "Memuat riwayat..." : "Tidak ada transaksi"} 
            keyField="invoice_number" 
          />
        </Card>

        <Card className="low-stock-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-box-open" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '6px', borderRadius: '6px' }}></i>
              Stok Menipis
            </h3>
          </div>
          <div className="list-modern">
            {!data ? (
              <p className="empty-note">Memeriksa stok...</p>
            ) : data.lowStocks.length === 0 ? (
              <div className="stock-safe">
                <i className="fas fa-check-circle fa-2x"></i>
                <p>Stok Aman</p>
              </div>
            ) : (
              data.lowStocks.map((item) => (
                <div className="item-modern" key={item.name}>
                  <div className="item-text">
                    <b>{item.name}</b>
                    <span>Sisa stok kritis</span>
                  </div>
                  <span className="badge-pill" style={{ background: '#fee2e2', color: '#ef4444' }}>
                    {item.stock} Unit
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}