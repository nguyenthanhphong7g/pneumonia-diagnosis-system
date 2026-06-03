import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
    Box, Button, Card, CardContent, Chip, CircularProgress, Fade, Grid, 
    LinearProgress, Paper, Stack, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, TablePagination, Typography
} from '@mui/material';
import {
    DashboardOutlined as DashboardIcon,
    RefreshOutlined as RefreshIcon,
    AnalyticsOutlined as AnalyticsIcon,
    HistoryOutlined as HistoryIcon,
    WarningAmberOutlined as WarningIcon,
    ScienceOutlined as ScienceIcon,
    ShowChartOutlined as ChartIcon,
    DonutLargeOutlined as DonutIcon,
    RateReviewOutlined as ReviewIcon,
    CheckCircleOutlined as TrainedIcon,
    HourglassTopOutlined as PendingIcon,
    EqualizerOutlined as RatioIcon,
    ArrowForwardOutlined as ArrowIcon
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
        } finalLabel: {
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
            totalReviews, usedForTraining, unusedForTraining,
            pneumoniaCount, normalCount, trainingRate, pneumoniaShare
        };
    }, [stats]);

    const chartRows = [
        { label: 'Dữ liệu đã huấn luyện', value: summary.usedForTraining, color: '#10b981' },
        { label: 'Chờ huấn luyện', value: summary.unusedForTraining, color: '#f59e0b' },
        { label: 'Viêm phổi', value: summary.pneumoniaCount, color: '#ef4444' },
        { label: 'Bình thường', value: summary.normalCount, color: '#3b82f6' },
    ];

    const maxValue = Math.max(...chartRows.map((row) => row.value), 1);
    const totalDistribution = Math.max(summary.totalReviews, summary.usedForTraining + summary.unusedForTraining || 1);

    const ringSegments = [
        { label: 'Viêm phổi', value: summary.pneumoniaCount, color: '#ef4444' },
        { label: 'Bình thường', value: summary.normalCount, color: '#3b82f6' },
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
            <Box sx={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <CircularProgress size={45} thickness={4.5} sx={{ color: '#7c3aed' }} />
                <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>Đang đồng bộ dữ liệu hệ thống...</Typography>
            </Box>
        );
    }

    return (
        <Fade in={true} timeout={400}>
            <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, py: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
                
                {/* HEADER BANNER */}
                <Paper
                    sx={{
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: '24px',
                        p: { xs: 3, md: 4 },
                        mb: 4,
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)'
                    }}
                >
                    <Box sx={{ position: 'absolute', bottom: -40, right: -40, width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(124, 58, 237, 0.04)', filter: 'blur(20px)' }} />
                    <Box sx={{ position: 'absolute', top: -30, left: -30, width: 140, height: 140, borderRadius: '50%', bgcolor: 'rgba(59, 130, 246, 0.04)', filter: 'blur(15px)' }} />

                    <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 500px' }}>
                            <Chip
                                icon={<DashboardIcon style={{ color: '#6d28d9', fontSize: '1.1rem' }} />}
                                label="HỆ THỐNG QUẢN TRỊ"
                                sx={{ mb: 2, fontWeight: 700, bgcolor: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', px: 0.5 }}
                            />
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', mb: 1 }}>
                                Bảng Điều Khiển Tổng Quan
                            </Typography>
                            <Typography sx={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                Giám sát cơ cấu dữ liệu lâm sàng, tiến trình cập nhật của mô hình trí tuệ nhân tạo học sâu và danh sách các phản hồi chờ xử lý theo thời gian thực.
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Button component={Link} to="/ai-diagnosis" variant="outlined" startIcon={<ScienceIcon />} sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 2.5, py: 1, borderColor: '#cbd5e1', color: '#334155', bgcolor: '#fff', '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' } }}>
                                Chẩn đoán AI
                            </Button>
                            <Button component={Link} to="/admin-dashboard" variant="contained" startIcon={<AnalyticsIcon />} sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 2.5, py: 1, bgcolor: '#7c3aed', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)', '&:hover': { bgcolor: '#6d28d9', boxShadow: '0 6px 16px rgba(124, 58, 237, 0.35)' } }}>
                                Quản lý Mô Hình
                            </Button>
                        </Box>
                    </Box>
                </Paper>

                {error && (
                    <Paper sx={{ mb: 4, p: 2, borderRadius: '16px', bgcolor: '#fef2f2', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <WarningIcon sx={{ color: '#ef4444' }} />
                        <Typography sx={{ color: '#b91c1c', fontWeight: 600, fontSize: '0.92rem' }}>{error}</Typography>
                    </Paper>
                )}

                {/* METRICS CARDS GRID */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {[
                        { label: 'Tổng số Reviews', value: summary.totalReviews, color: '#3b82f6', bg: '#eff6ff', desc: 'Toàn bộ đánh giá từ bác sĩ', icon: <ReviewIcon sx={{ color: '#3b82f6' }} /> },
                        { label: 'Đã huấn luyện', value: summary.usedForTraining, color: '#10b981', bg: '#ecfdf5', desc: 'Đã tích hợp vào mô hình', icon: <TrainedIcon sx={{ color: '#10b981' }} /> },
                        { label: 'Đang chờ xử lý', value: summary.unusedForTraining, color: '#f59e0b', bg: '#fffbeb', desc: 'Dữ liệu mới nhận chưa train', icon: <PendingIcon sx={{ color: '#f59e0b' }} /> },
                        { label: 'Tỷ lệ phân loại', value: `${summary.pneumoniaCount} / ${summary.normalCount}`, color: '#ef4444', bg: '#fef2f2', desc: 'Viêm phổi / Bình thường', icon: <RatioIcon sx={{ color: '#ef4444' }} /> },
                    ].map((item) => (
                        <Grid item xs={12} sm={6} lg={3} key={item.label}>
                            <Card 
                                sx={{ 
                                    height: '100%', 
                                    borderRadius: '20px', 
                                    border: '1px solid #e2e8f0', 
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 12px 20px -5px rgba(0, 0, 0, 0.05), 0 8px 16px -5px rgba(0, 0, 0, 0.03)'
                                    }
                                }}
                            >
                                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.78rem' }}>
                                            {item.label}
                                        </Typography>
                                        <Box sx={{ p: 1, borderRadius: '12px', bgcolor: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {item.icon}
                                        </Box>
                                    </Box>
                                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1, mb: 1.5 }}>
                                        {item.value}
                                    </Typography>
                                    <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', mt: 'auto' }}>
                                        {item.desc}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* MAIN DASHBOARD CONTENT */}
                <Grid container spacing={3}>
                    {/* LEFT GRAPH PANEL */}
                    <Grid item xs={12} lg={7}>
                        <Card sx={{ borderRadius: '24px', border: '1px solid #e2e8f0', height: '100%', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1.2, fontSize: '1.1rem' }}>
                                        <ChartIcon sx={{ color: '#7c3aed' }} /> Phân tích cấu trúc dữ liệu
                                    </Typography>
                                    <Button onClick={loadOverview} startIcon={<RefreshIcon />} size="small" sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
                                        Làm mới
                                    </Button>
                                </Box>

                                <Grid container spacing={4} alignItems="center">
                                    {/* Donut Chart Display */}
                                    <Grid item xs={12} sm={5} sx={{ display: 'flex', justifyContent: 'center' }}>
                                        <Paper sx={{ p: 2, borderRadius: '20px', background: '#0f172a', width: '100%', maxWidth: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 10px 25px rgba(15,23,42,0.15)' }}>
                                            <Box sx={{ position: 'relative', width: 170, height: 170, borderRadius: '50%', ...ringStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Box sx={{ position: 'absolute', inset: 24, borderRadius: '50%', bgcolor: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                                    <DonutIcon sx={{ color: '#cbd5e1', mb: 0.25, fontSize: '1.2rem' }} />
                                                    <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.6rem', lineHeight: 1 }}>{summary.totalReviews}</Typography>
                                                    <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem', mt: 0.25, uppercase: 'true' }}>Tổng mẫu</Typography>
                                                </Box>
                                            </Box>
                                            
                                            <Stack spacing={1} sx={{ width: '100%', mt: 2, pt: 1, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                                {ringSegments.map((segment) => (
                                                    <Box key={segment.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: segment.color }} />
                                                            <Typography sx={{ color: '#cbd5e1', fontWeight: 500, fontSize: '0.78rem' }}>{segment.label}</Typography>
                                                        </Box>
                                                        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.82rem' }}>{segment.value}</Typography>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Paper>
                                    </Grid>

                                    {/* Linear Progress Bars */}
                                    <Grid item xs={12} sm={7}>
                                        <Stack spacing={2.5}>
                                            {chartRows.map((row) => (
                                                <Box key={row.label}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 0.75 }}>
                                                        <Box>
                                                            <Typography sx={{ fontWeight: 700, color: '#334155', fontSize: '0.88rem' }}>{row.label}</Typography>
                                                            <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tỷ trọng: {Math.round((row.value / totalDistribution) * 100)}%</Typography>
                                                        </Box>
                                                        <Chip label={`${row.value} ca`} size="small" sx={{ fontWeight: 700, bgcolor: `${row.color}12`, color: row.color, height: 22, fontSize: '0.75rem' }} />
                                                    </Box>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={(row.value / maxValue) * 100}
                                                        sx={{
                                                            height: 8,
                                                            borderRadius: 4,
                                                            bgcolor: '#f1f5f9',
                                                            '& .MuiLinearProgress-bar': {
                                                                borderRadius: 4,
                                                                bgcolor: row.color,
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Grid>
                                </Grid>

                                {/* Bottom Feature Highlights */}
                                <Grid container spacing={2} sx={{ mt: 3, pt: 2, borderTop: '1px solid #f1f5f9' }}>
                                    <Grid item xs={6}>
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: '16px', bgcolor: '#f0fdf4', borderColor: '#bbf7d0', textAlign: 'center' }}>
                                            <Typography sx={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', mb: 0.5 }}>Hiệu suất nạp dữ liệu</Typography>
                                            <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: '#166534', lineHeight: 1 }}>{summary.trainingRate}%</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: '16px', bgcolor: '#fef2f2', borderColor: '#fecaca', textAlign: 'center' }}>
                                            <Typography sx={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 700, textTransform: 'uppercase', mb: 0.5 }}>Tỷ lệ bệnh lý dương tính</Typography>
                                            <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: '#991b1b', lineHeight: 1 }}>{summary.pneumoniaShare}%</Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* RIGHT ACTIONS & TABLE PANEL */}
                    <Grid item xs={12} lg={5}>
                        <Stack spacing={3} sx={{ height: '100%' }}>
                            
                            {/* OPERATIONAL SUGGESTIONS */}
                            <Card sx={{ borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.1rem' }}>
                                        <WarningIcon sx={{ color: '#f59e0b' }} /> Khuyến Nghị Hành Động
                                    </Typography>
                                    <Stack spacing={1.5}>
                                        <Box 
                                            component={Link} 
                                            to="/admin-dashboard"
                                            sx={{ 
                                                p: 2, borderRadius: '16px', bgcolor: '#fff7ed', border: '1px solid #ffedd5', 
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none',
                                                transition: 'all 0.2s', '&:hover': { bgcolor: '#fff1e2', transform: 'translateX(4px)' }
                                            }}
                                        >
                                            <Box>
                                                <Typography sx={{ fontWeight: 700, color: '#c2410c', fontSize: '0.88rem' }}>Yêu cầu tái huấn luyện (Retrain)</Typography>
                                                <Typography sx={{ color: '#9a3412', fontSize: '0.8rem', mt: 0.25 }}>Có {summary.unusedForTraining} dữ liệu lâm sàng mới đang đợi cập nhật.</Typography>
                                            </Box>
                                            <ArrowIcon sx={{ color: '#c2410c', fontSize: '1.2rem' }} />
                                        </Box>

                                        <Box 
                                            component={Link} 
                                            to="/ai-diagnosis"
                                            sx={{ 
                                                p: 2, borderRadius: '16px', bgcolor: '#f0f9ff', border: '1px solid #e0f2fe', 
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none',
                                                transition: 'all 0.2s', '&:hover': { bgcolor: '#e0f2fe', transform: 'translateX(4px)' }
                                            }}
                                        >
                                            <Box>
                                                <Typography sx={{ fontWeight: 700, color: '#0369a1', fontSize: '0.88rem' }}>Thử nghiệm mô hình</Typography>
                                                <Typography sx={{ color: '#075985', fontSize: '#0.8rem', mt: 0.25 }}>Truy cập phòng thí nghiệm AI để kiểm thử ảnh X-Quang mới.</Typography>
                                            </Box>
                                            <ArrowIcon sx={{ color: '#0369a1', fontSize: '1.2rem' }} />
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>

                            {/* RECENT PENDING REVIEWS TABLE */}
                            <Card sx={{ borderRadius: '24px', border: '1px solid #e2e8f0', flexGrow: 1, display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
                                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.1rem' }}>
                                        <HistoryIcon sx={{ color: '#7c3aed' }} /> Hàng Chờ Xử Lý Gần Nhất
                                    </Typography>
                                    
                                    <TableContainer sx={{ maxHeight: 280, flexGrow: 1 }}>
                                        <Table size="small" stickyHeader>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc', color: '#64748b', borderBottom: '2px solid #e2e8f0', py: 1.5 }}>ID mẫu</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc', color: '#64748b', borderBottom: '2px solid #e2e8f0', py: 1.5 }}>Nhãn chuẩn</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc', color: '#64748b', borderBottom: '2px solid #e2e8f0', py: 1.5 }}>Ngày duyệt</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {recentRows.length > 0 ? recentRows.map((review) => (
                                                    <TableRow key={review.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                        <TableCell sx={{ color: '#334155', fontWeight: 600, py: 1.5 }}>#{review.id}</TableCell>
                                                        <TableCell sx={{ py: 1.5 }}>
                                                            <Chip
                                                                label={review.finalLabel === 'Pneumonia' ? 'Viêm phổi' : 'Bình thường'}
                                                                size="small"
                                                                sx={{
                                                                    fontWeight: 700,
                                                                    fontSize: '0.72rem',
                                                                    bgcolor: review.finalLabel === 'Pneumonia' ? '#fee2e2' : '#dcfce7',
                                                                    color: review.finalLabel === 'Pneumonia' ? '#ef4444' : '#15803d',
                                                                    borderRadius: '6px'
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ color: '#64748b', fontSize: '0.8rem', py: 1.5 }}>
                                                            {new Date(review.reviewedAt).toLocaleDateString('vi-VN')}
                                                        </TableCell>
                                                    </TableRow>
                                                )) : (
                                                    <TableRow>
                                                        <TableCell colSpan={3} align="center" sx={{ py: 6, color: '#94a3b8', fontSize: '0.88rem' }}>
                                                            Sạch hàng chờ! Không có dữ liệu chưa xử lý.
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
                                        rowsPerPageOptions={[5, 10]}
                                        labelRowsPerPage="Số dòng:"
                                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
                                        sx={{ 
                                            borderTop: '1px solid #e2e8f0', mt: 'auto', pt: 0.5,
                                            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: '0.78rem', color: '#64748b' }
                                        }}
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