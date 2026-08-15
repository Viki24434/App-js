import { useEffect, useRef, useState } from 'react';
import { Chart } from 'chart.js/auto';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard/StatCard';
import './Dashboard.css';

const formatRp = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(v || 0);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [now, setNow] = useState(new Date());
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Jam real-time (ganti setInterval manual + document.getElementById)
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Ambil data dashboard sekali saat halaman dibuka
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

  // Render chart. Chart lama dihancurkan dulu sebelum bikin baru
  // (versi HTML lama gak pernah destroy chart -> leak kalau halaman dibuka berkali-kali)
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
        <div className="panel-glass">
          <div className="panel-header">
            <h3>
              <i className="fas fa-chart-line" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)' }}></i>
              Grafik Performa Mingguan
            </h3>
            <select style={{ width: 'auto', padding: '5px 10px', fontSize: 11 }}>
              <option>7 Hari Terakhir</option>
              <option>30 Hari Terakhir</option>
            </select>
          </div>
          <div style={{ height: 300 }}>
            <canvas ref={chartRef}></canvas>
          </div>
        </div>

        <div className="panel-glass">
          <div className="panel-header">
            <h3>
              <i className="fas fa-fire" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}></i>
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
        </div>
      </div>

      <div className="main-grid">
        <div className="panel-glass">
          <div className="panel-header">
            <h3>
              <i className="fas fa-exchange-alt" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}></i>
              Aktivitas Terakhir
            </h3>
            <button onClick={() => navigate('/orders')} className="btn btn-info" style={{ padding: '5px 12px', fontSize: 11 }}>
              Lihat Semua
            </button>
          </div>
          <div className="table-responsive">
            <table className="table-modern-mini">
              <thead>
                <tr>
                  <th>No. Invoice</th>
                  <th>Pelanggan</th>
                  <th>Total Tagihan</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {!data ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20 }}>Memuat riwayat...</td></tr>
                ) : data.recentOrders.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center' }}>Tidak ada transaksi</td></tr>
                ) : (
                  data.recentOrders.map((order) => (
                    <tr key={order.invoice_number}>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{order.invoice_number}</td>
                      <td><b>{order.customer_name}</b></td>
                      <td>{formatRp(order.total_amount)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className="badge-pill"
                          style={
                            order.payment_status === 'Lunas'
                              ? { background: '#dcfce7', color: '#166534' }
                              : { background: '#fee2e2', color: '#991b1b' }
                          }
                        >
                          {order.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel-glass low-stock-panel">
          <div className="panel-header">
            <h3>
              <i className="fas fa-box-open" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}></i>
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
        </div>
      </div>
    </div>
  );
}
