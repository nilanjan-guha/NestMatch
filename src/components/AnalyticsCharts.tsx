'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function AnalyticsCharts() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/owner/analytics/charts')
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setData(res);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load analytics", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', background: 'var(--surface)', borderRadius: '12px' }}>
        <div style={{ fontSize: '24px', animation: 'spin 1s linear infinite' }}>🔄</div>
        <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>Loading Analytics...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ marginBottom: '40px' }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', borderTop: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Total Properties</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--foreground)' }}>{data.stats.totalProperties}</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', borderTop: '4px solid #ec4899' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Occupancy Rate</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--foreground)' }}>{data.stats.occupancyRate}%</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', borderTop: '4px solid #10b981' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Leads / Interests (30d)</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--foreground)' }}>{data.stats.totalInterests}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        {/* Timeline Chart */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '20px', color: 'var(--primary)', fontSize: '18px' }}>📈 Booking Interests Over Time (30 Days)</h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Line type="monotone" dataKey="interests" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, fill: '#ec4899' }} activeDot={{ r: 6 }} name="Leads" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Bar Chart */}
        {data.propertyPerformance && data.propertyPerformance.length > 0 && (
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '20px', color: 'var(--primary)', fontSize: '18px' }}>🏆 Property Saves / Watchlist</h3>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.propertyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="saves" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Users Saved" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
