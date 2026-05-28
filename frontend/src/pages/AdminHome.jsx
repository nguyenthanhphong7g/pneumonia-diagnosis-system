import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
    Box, Button, Card, CardContent, Chip, CircularProgress, Divider,
    Fade, Grid, LinearProgress, Paper, Stack, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, TablePagination, Typography
} from '@mui/material';
import {
    DashboardOutlined as DashboardIcon,
    RefreshOutlined as RefreshIcon,
    AnalyticsOutlined as AnalyticsIcon,
    AssessmentOutlined as AssessmentIcon,
    HistoryOutlined as HistoryIcon,
    WarningAmberOutlined as WarningIcon,
    ScienceOutlined as ScienceIcon,
    ShowChartOutlined as ChartIcon,
    DonutLargeOutlined as DonutIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../config/api';
import { AuthContext } from '../context/AuthContext';

const AdminHome = () => {
    const { token } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [unusedReviews, setUnusedReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tablePage, setTablePage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const API_BASE = `${API_BASE_URL}/api`;

    const loadOverview = async () => {
        if (!token) return;

        try {
            setLoading(true);
            setError(null);

            const headers = { Authorization: `Bearer ${token}` };
            const [statsRes, reviewsRes] = await Promise.all([
                axios.get(`${API_BASE}/admin/model-stats`, { headers }),
                axios.get(`${API_BASE}/admin/unused-reviews`, { headers })
            ]);

            setStats(statsRes.data || null);
            setUnusedReviews(reviewsRes.data?.reviews || []);
        } catch (err) {
            console.error('Failed to load admin home:', err);
            setError(err.response?.data?.message || err.message || 'Không thể tải dữ liệu tổng quan');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOverview();
    }, [token]);

    const summary = useMemo(() => {
        const totalReviews = stats?.totalReviews || 0;
        const usedForTraining = stats?.usedForTraining || 0;
        const unusedForTraining = stats?.unusedForTraining || 0;
        const pneumoniaCount = stats?.pneumoniaCount || 0;
        const normalCount = stats?.normalCount || 0;
        const trainingRate = totalReviews > 0 ? Math.round((usedForTraining / totalReviews) * 100) : 0;
        const pneumoniaShare = totalReviews > 0 ? Math.round((pneumoniaCount / totalReviews) * 100) : 0;

        return {
            totalReviews,
            usedForTraining,
            unusedForTraining,
            pneumoniaCount,
            normalCount,
            trainingRate,
            pneumoniaShare
        };
    }, [stats]);

    const chartRows = [
        { label: 'Dữ liệu đã huấn luyện', value: summary.usedForTraining, color: '#10b981' },
        { label: 'Chờ huấn luyện', value: summary.unusedForTraining, color: '#f59e0b' },
        { label: 'Pneumonia', value: summary.pneumoniaCount, color: '#ef4444' },
        { label: 'Normal', value: summary.normalCount, color: '#2563eb' },
    ];

    const maxValue = Math.max(...chartRows.map((row) => row.value), 1);
    const totalDistribution = Math.max(summary.totalReviews, summary.usedForTraining + summary.unusedForTraining || 1);

    const ringSegments = [
        { label: 'Pneumonia', value: summary.pneumoniaCount, color: '#ef4444' },
        { label: 'Normal', value: summary.normalCount, color: '#2563eb' },
        { label: 'Đã huấn luyện', value: summary.usedForTraining, color: '#10b981' },
        { label: 'Chờ huấn luyện', value: summary.unusedForTraining, color: '#f59e0b' },
    ].filter((segment) => segment.value > 0);

    const ringStyle = ringSegments.length > 0
        ? {
            background: `conic-gradient(${ringSegments
                .reduce((acc, segment) => {
                    const start = acc.offset;
                    const sweep = (segment.value / totalDistribution) * 360;
                    acc.parts.push(`${segment.color} ${start}deg ${start + sweep}deg`);
                    acc.offset += sweep;
                    return acc;
                }, { parts: [], offset: 0 }).parts.join(', ')})`,
        }
        : { background: 'conic-gradient(#e2e8f0 0deg 360deg)' };

    const recentRows = [...unusedReviews]
        .sort((left, right) => new Date(right.reviewedAt) - new Date(left.reviewedAt))
        .slice(tablePage * rowsPerPage, tablePage * rowsPerPage + rowsPerPage);

    if (loading) {
        return (
            <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    return (
        <Fade in={true}>
            <Box sx={{ px: { xs: 1, sm: 1.5, md: 2 }, py: 2 }}>
                <Paper
                    sx={{
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: '28px',
                        p: { xs: 2.5, md: 3.5 },
                        mb: 3,
                        border: '1px solid #e2e8f0',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.06)'
                    }}
                >
                    <Box sx={{ position: 'absolute', inset: 'auto -50px -60px auto', width: 220, height: 220, borderRadius: '50%', bgcolor: 'rgba(124, 58, 237, 0.06)', filter: 'blur(4px)' }} />
                    <Box sx={{ position: 'absolute', inset: '-60px auto auto -40px', width: 160, height: 160, borderRadius: '50%', bgcolor: 'rgba(37, 99, 235, 0.06)' }} />

                    <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ maxWidth: 720 }}>
                            <Chip
                                icon={<DashboardIcon />}
                                label="ADMIN HOME"
                                sx={{ mb: 1.5, fontWeight: 800, bgcolor: '#ede9fe', color: '#6d28d9', borderRadius: '999px' }}
                            />
                            <Typography variant="h4" sx={{ fontWeight: 950, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1.05 }}>
                                Bảng điều khiển quản trị
                            </Typography>
                            <Typography sx={{ color: '#64748b', mt: 1.25, fontSize: '0.98rem', maxWidth: 680 }}>
                                Biểu đồ được trình bày theo kiểu trực quan: vòng donut cho cơ cấu dữ liệu, thanh tiến độ cho trạng thái model và bảng tổng hợp cho các review chờ xử lý.
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <Button component={Link} to="/ai-diagnosis" variant="outlined" startIcon={<ScienceIcon />} sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, bgcolor: '#fff' }}>
                                Chẩn đoán AI
                            </Button>
                            <Button component={Link} to="/admin-dashboard" variant="contained" startIcon={<AnalyticsIcon />} sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, bgcolor: '#7c3aed' }}>
                                Bảng điều khiển
                            </Button>
                        </Box>
                    </Box>
                </Paper>

                {error && (
                    <Paper sx={{ mb: 3, p: 2.5, borderRadius: '18px', bgcolor: '#fef2f2', border: '1px solid #fecaca' }}>
                        <Typography sx={{ color: '#b91c1c', fontWeight: 700 }}>{error}</Typography>
                    </Paper>
                )}

                <Box
                    sx={{
                        display: 'grid',
                        gap: 2,
                        mb: 3,
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, minmax(0, 1fr))',
                            lg: 'repeat(4, minmax(0, 1fr))'
                        }
                    }}
                >
                    {[
                        { label: 'Tổng Reviews', value: summary.totalReviews, color: '#2563eb', bg: '#eff6ff' },
                        { label: 'Đã huấn luyện', value: summary.usedForTraining, color: '#10b981', bg: '#ecfdf5' },
                        { label: 'Chờ xử lý', value: summary.unusedForTraining, color: '#f59e0b', bg: '#fffbeb' },
                        { label: 'Pneumonia | Normal', value: `${summary.pneumoniaCount} / ${summary.normalCount}`, color: '#ef4444', bg: '#fef2f2' },
                    ].map((item) => (
                        <Card key={item.label} sx={{ height: '100%', borderRadius: '22px', border: '1px solid #e2e8f0', boxShadow: '0 16px 28px rgba(15, 23, 42, 0.05)', overflow: 'hidden' }}>
                            <Box sx={{ height: 6, bgcolor: item.color }} />
                            <CardContent sx={{ p: 2.5, bgcolor: '#fff' }}>
                                <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {item.label}
                                </Typography>
                                <Typography variant="h4" sx={{ mt: 1, fontWeight: 950, color: item.color, lineHeight: 1 }}>
                                    {item.value}
                                </Typography>
                                <Typography sx={{ mt: 1, color: '#94a3b8', fontSize: '0.8rem' }}>
                                    Cập nhật theo dữ liệu mới nhất của hệ thống
                                </Typography>
                            </CardContent>
                        </Card>
                    ))}
                </Box>

                <Grid container spacing={1} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={7}>
                        <Card sx={{ borderRadius: '28px', border: '1px solid #e2e8f0', height: '100%', overflow: 'hidden', boxShadow: '0 18px 36px rgba(15, 23, 42, 0.06)' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ChartIcon sx={{ color: '#2563eb' }} /> Biểu đồ dữ liệu huấn luyện
                                        </Typography>
                                    </Box>
                                    <Button onClick={loadOverview} startIcon={<RefreshIcon />} size="small" sx={{ textTransform: 'none', fontWeight: 800, borderRadius: '12px' }}>
                                        Làm mới
                                    </Button>
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={5}>
                                        <Paper sx={{ p: 2.5, borderRadius: '24px', bgcolor: 'linear-gradient(135deg, #0f172a 0%, #111827 100%)', background: 'linear-gradient(135deg, #0f172a 0%, #111827 100%)', color: '#fff', position: 'relative', overflow: 'hidden', minHeight: 320 }}>
                                            <Box sx={{ position: 'absolute', inset: 'auto -20px -30px auto', width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
                                            <Box sx={{ position: 'absolute', inset: '-30px auto auto -30px', width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)', mb: 2 }}>
                                                Cơ cấu dữ liệu
                                            </Typography>

                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 2 }}>
                                                <Box sx={{ position: 'relative', width: 210, height: 210, borderRadius: '50%', ...ringStyle, boxShadow: '0 18px 30px rgba(0,0,0,0.22)' }}>
                                                    <Box sx={{ position: 'absolute', inset: 28, borderRadius: '50%', bgcolor: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                        <DonutIcon sx={{ color: '#c4b5fd', mb: 0.5 }} />
                                                        <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '2rem', lineHeight: 1 }}>{summary.totalReviews}</Typography>
                                                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', mt: 0.25 }}>Tổng review</Typography>
                                                    </Box>
                                                </Box>
                                            </Box>

                                            <Stack spacing={1.2} sx={{ position: 'relative', zIndex: 1 }}>
                                                {ringSegments.map((segment) => (
                                                    <Box key={segment.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: segment.color, boxShadow: `0 0 0 4px ${segment.color}20` }} />
                                                            <Typography sx={{ color: 'rgba(255,255,255,0.92)', fontWeight: 700, fontSize: '0.85rem' }}>{segment.label}</Typography>
                                                        </Box>
                                                        <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.95rem' }}>{segment.value}</Typography>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Paper>
                                    </Grid>

                                    <Grid item xs={12} sm={7}>
                                        <Stack spacing={1.8}>
                                            {chartRows.map((row, index) => (
                                                <Paper key={row.label} sx={{ p: 1.8, borderRadius: '18px', border: '1px solid #e2e8f0', bgcolor: index % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.85, alignItems: 'center' }}>
                                                        <Box>
                                                            <Typography sx={{ fontWeight: 800, color: '#0f172a' }}>{row.label}</Typography>
                                                            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{Math.round((row.value / totalDistribution) * 100)}% của tổng dữ liệu</Typography>
                                                        </Box>
                                                        <Chip label={row.value} size="small" sx={{ fontWeight: 900, bgcolor: `${row.color}14`, color: row.color }} />
                                                    </Box>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={(row.value / maxValue) * 100}
                                                        sx={{
                                                            height: 12,
                                                            borderRadius: 999,
                                                            bgcolor: '#e2e8f0',
                                                            '& .MuiLinearProgress-bar': {
                                                                borderRadius: 999,
                                                                bgcolor: row.color,
                                                                backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.18), rgba(255,255,255,0))'
                                                            }
                                                        }}
                                                    />
                                                </Paper>
                                            ))}

                                            <Grid container spacing={1.5} sx={{ pt: 0.5 }}>
                                                <Grid item xs={6}>
                                                    <Paper sx={{ p: 2, borderRadius: '18px', bgcolor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                                                        <Typography sx={{ fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 800, textTransform: 'uppercase' }}>Tỷ lệ huấn luyện</Typography>
                                                        <Typography sx={{ fontSize: '1.9rem', fontWeight: 950, color: '#1d4ed8', lineHeight: 1.1 }}>{summary.trainingRate}%</Typography>
                                                        <Typography sx={{ color: '#1d4ed8', fontSize: '0.8rem' }}>Model đã nhận dữ liệu mới</Typography>
                                                    </Paper>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Paper sx={{ p: 2, borderRadius: '18px', bgcolor: '#fff1f2', border: '1px solid #fecdd3' }}>
                                                        <Typography sx={{ fontSize: '0.72rem', color: '#be123c', fontWeight: 800, textTransform: 'uppercase' }}>Tỷ lệ Pneumonia</Typography>
                                                        <Typography sx={{ fontSize: '1.9rem', fontWeight: 950, color: '#be123c', lineHeight: 1.1 }}>{summary.pneumoniaShare}%</Typography>
                                                        <Typography sx={{ color: '#be123c', fontSize: '0.8rem' }}>Trong tổng số chẩn đoán</Typography>
                                                    </Paper>
                                                </Grid>
                                            </Grid>
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={5}>
                        <Stack spacing={3}>
                            <Card sx={{ borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 16px 30px rgba(15, 23, 42, 0.05)' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <WarningIcon sx={{ color: '#f59e0b' }} /> Gợi ý vận hành
                                    </Typography>
                                    <Stack spacing={1.5}>
                                        <Box sx={{ p: 1.5, borderRadius: '14px', bgcolor: '#fff7ed', border: '1px solid #fed7aa' }}>
                                            <Typography sx={{ fontWeight: 800, color: '#9a3412', fontSize: '0.9rem' }}>Chờ retrain</Typography>
                                            <Typography sx={{ color: '#9a3412', fontSize: '0.8rem' }}>{summary.unusedForTraining} review chưa được đưa vào huấn luyện.</Typography>
                                        </Box>
                                        <Box sx={{ p: 1.5, borderRadius: '14px', bgcolor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                                            <Typography sx={{ fontWeight: 800, color: '#1d4ed8', fontSize: '0.9rem' }}>Xem nhanh chẩn đoán</Typography>
                                            <Typography sx={{ color: '#1d4ed8', fontSize: '0.8rem' }}>Mở trang AI để kiểm tra ca bệnh hoặc so sánh model.</Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>

                            <Card sx={{ borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 16px 30px rgba(15, 23, 42, 0.05)' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <HistoryIcon sx={{ color: '#7c3aed' }} /> Dữ liệu chờ xử lý gần nhất
                                    </Typography>
                                    <TableContainer sx={{ maxHeight: 320 }}>
                                        <Table size="small" stickyHeader>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 900, bgcolor: '#f8fafc', color: '#334155' }}>ID</TableCell>
                                                    <TableCell sx={{ fontWeight: 900, bgcolor: '#f8fafc', color: '#334155' }}>Nhãn</TableCell>
                                                    <TableCell sx={{ fontWeight: 900, bgcolor: '#f8fafc', color: '#334155' }}>Ngày</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {recentRows.length > 0 ? recentRows.map((review) => (
                                                    <TableRow key={review.id} hover>
                                                        <TableCell sx={{ color: '#475569', fontWeight: 800 }}>#{review.id}</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={review.finalLabel === 'Pneumonia' ? 'Viêm phổi' : 'Bình thường'}
                                                                size="small"
                                                                sx={{
                                                                    fontWeight: 800,
                                                                    bgcolor: review.finalLabel === 'Pneumonia' ? '#fee2e2' : '#dcfce7',
                                                                    color: review.finalLabel === 'Pneumonia' ? '#b91c1c' : '#166534'
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>
                                                            {new Date(review.reviewedAt).toLocaleDateString('vi-VN')}
                                                        </TableCell>
                                                    </TableRow>
                                                )) : (
                                                    <TableRow>
                                                        <TableCell colSpan={3} align="center" sx={{ py: 3, color: '#94a3b8' }}>
                                                            Không có dữ liệu chờ xử lý
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                    <TablePagination
                                        component="div"
                                        count={unusedReviews.length}
                                        page={tablePage}
                                        onPageChange={(_, nextPage) => setTablePage(nextPage)}
                                        rowsPerPage={rowsPerPage}
                                        onRowsPerPageChange={(event) => {
                                            setRowsPerPage(parseInt(event.target.value, 10));
                                            setTablePage(0);
                                        }}
                                        rowsPerPageOptions={[5, 10, 20]}
                                        labelRowsPerPage="Số dòng"
                                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
                                        sx={{ mt: 1 }}
                                    />
                                </CardContent>
                            </Card>
                        </Stack>
                    </Grid>
                </Grid>

            </Box>
        </Fade>
    );
};

export default AdminHome;