import React, { useState, useEffect } from 'react';
import {
    Box, Card, CardContent, Typography, Button, Grid, LinearProgress,
    Alert, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
    CircularProgress, Chip, alpha, Fade
} from '@mui/material';
import {
    RefreshOutlined as RefreshIcon,
    CloudUploadOutlined as RetrainIcon,
    BarChartOutlined as StatsIcon,
    CheckCircleOutlined as VerifiedIcon,
    WarningAmberOutlined as WarningIcon,
    ModelTrainingOutlined as TrainingIcon,
    HistoryOutlined as RecentIcon
} from '@mui/icons-material';
import axios from 'axios';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [unusedReviews, setUnusedReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [retraining, setRetraining] = useState(false);
    const [message, setMessage] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [retrainType, setRetrainType] = useState(null);

    const API_BASE = 'http://localhost:8080/api';

    useEffect(() => {
        loadStats();
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const statsRes = await axios.get(`${API_BASE}/admin/model-stats`);
            setStats(statsRes.data);

            const reviewsRes = await axios.get(`${API_BASE}/admin/unused-reviews`);
            setUnusedReviews(reviewsRes.data.reviews || []);
        } catch (error) {
            console.error('Error loading stats:', error);
            setMessage({
                type: 'error',
                text: 'Lỗi kết nối Server: ' + error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRetrain = async (type) => {
        setOpenDialog(false);
        setRetraining(true);
        setMessage(null);

        try {
            const endpoint = type === 'unused' ? '/admin/retrain-unused' : '/admin/retrain-all';
            const response = await axios.post(`${API_BASE}${endpoint}`);

            setMessage({
                type: 'success',
                text: `${response.data.message} - Đã xử lý ${response.data.samples_processed} mẫu dữ liệu.`,
            });
            setTimeout(loadStats, 2000);
        } catch (error) {
            setMessage({
                type: 'error',
                text: 'Lỗi khi retrain: ' + (error.response?.data?.message || error.message),
            });
        } finally {
            setRetraining(false);
        }
    };

    const getProgressPercentage = () => {
        if (!stats || stats.totalReviews === 0) return 0;
        return (stats.usedForTraining / stats.totalReviews) * 100;
    };

    return (
        <Fade in={true}>
            <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
                {/* Header */}
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <StatsIcon sx={{ fontSize: 35, color: '#2563eb' }} />
                            Model Management
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', ml: 6 }}>
                            Giám sát và huấn luyện lại mô hình Vision Transformer (ViT)
                        </Typography>
                    </Box>
                    <Button
                        startIcon={<RefreshIcon />}
                        onClick={loadStats}
                        disabled={loading}
                        sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700 }}
                    >
                        Làm mới
                    </Button>
                </Box>

                {message && (
                    <Alert severity={message.type} sx={{ mb: 3, borderRadius: '12px', fontWeight: 500 }} onClose={() => setMessage(null)}>
                        {message.text}
                    </Alert>
                )}

                {/* Stat Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {[
                        { label: 'Tổng Reviews', value: stats?.totalReviews, color: '#2563eb', bg: '#eff6ff' },
                        { label: 'Đã Huấn Luyện', value: stats?.usedForTraining, color: '#10b981', bg: '#ecfdf5' },
                        { label: 'Dữ Liệu Mới', value: stats?.unusedForTraining, color: '#f59e0b', bg: '#fffbeb' },
                        { label: 'Pneumonia | Normal', value: `${stats?.pneumoniaCount || 0} / ${stats?.normalCount || 0}`, color: '#ef4444', bg: '#fef2f2' }
                    ].map((item, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <Card sx={{ borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
                                <CardContent sx={{ bgcolor: item.bg }}>
                                    <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 700 }}>{item.label}</Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 800, color: item.color, mt: 1 }}>{item.value || 0}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* Progress Card */}
                <Card sx={{ borderRadius: '20px', mb: 4, p: 1, border: '1px solid #e2e8f0' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TrainingIcon color="primary" /> Tỷ lệ dữ liệu đã huấn luyện
                            </Typography>
                            <Typography sx={{ fontWeight: 800, color: '#2563eb' }}>{Math.round(getProgressPercentage())}%</Typography>
                        </Box>
                        <LinearProgress 
                            variant="determinate" 
                            value={getProgressPercentage()} 
                            sx={{ height: 12, borderRadius: 6, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { borderRadius: 6 } }}
                        />
                        <Typography variant="caption" sx={{ mt: 1.5, display: 'block', color: '#64748b', textAlign: 'right' }}>
                             {stats?.usedForTraining} trên {stats?.totalReviews} mẫu đã được tích hợp vào Model
                        </Typography>
                    </CardContent>
                </Card>

                <Grid container spacing={4}>
                    {/* Retrain Actions */}
                    <Grid item xs={12} md={5}>
                        <Card sx={{ borderRadius: '20px', height: '100%', border: '1px solid #e2e8f0' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>🔄 Huấn luyện lại (Retrain)</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        startIcon={retraining ? <CircularProgress size={20} color="inherit" /> : <RetrainIcon />}
                                        onClick={() => { setRetrainType('unused'); setOpenDialog(true); }}
                                        disabled={retraining || !stats?.unusedForTraining}
                                        sx={{ borderRadius: '12px', p: 1.5, fontWeight: 700, bgcolor: '#2563eb' }}
                                    >
                                        Chỉ cập nhật dữ liệu mới
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        startIcon={<RetrainIcon />}
                                        onClick={() => { setRetrainType('all'); setOpenDialog(true); }}
                                        disabled={retraining || !stats?.totalReviews}
                                        sx={{ borderRadius: '12px', p: 1.5, fontWeight: 700, border: '2px solid' }}
                                    >
                                        Huấn luyện lại toàn bộ
                                    </Button>
                                </Box>

                                <Box sx={{ mt: 4, p: 2, borderRadius: '12px', bgcolor: '#f1f5f9' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <WarningIcon fontSize="small" color="warning" /> Model Info:
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7 }}>
                                        • Kiến trúc: <b>ViT + Logistic Regression</b><br />
                                        • Chuẩn hóa: <b>StandardScaler</b><br />
                                        • Tệp tin: <code>model_lr.pkl</code>, <code>scaler.pkl</code>
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Table */}
                    <Grid item xs={12} md={7}>
                        <Card sx={{ borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <RecentIcon color="action" /> Dữ liệu mới chưa Retrain
                                </Typography>
                                <TableContainer sx={{ maxHeight: 350 }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>ID</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Nhãn Bác Sĩ</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Thời gian</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {unusedReviews.length > 0 ? unusedReviews.slice(0, 10).map((review) => (
                                                <TableRow key={review.id} hover>
                                                    <TableCell sx={{ color: '#64748b' }}>#{review.id}</TableCell>
                                                    <TableCell>
                                                        <Chip 
                                                            label={review.finalLabel === 'Pneumonia' ? 'Viêm phổi' : 'Bình thường'} 
                                                            size="small"
                                                            sx={{ 
                                                                fontWeight: 700,
                                                                bgcolor: review.finalLabel === 'Pneumonia' ? '#fee2e2' : '#dcfce7',
                                                                color: review.finalLabel === 'Pneumonia' ? '#b91c1c' : '#15803d'
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: '0.8rem' }}>
                                                        {new Date(review.reviewedAt).toLocaleDateString('vi-VN')}
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                                                        Không có dữ liệu mới chờ xử lý
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Retrain Dialog */}
                <Dialog open={openDialog} onClose={() => setOpenDialog(false)} PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
                    <DialogTitle sx={{ fontWeight: 800 }}>Xác nhận huấn luyện lại?</DialogTitle>
                    <DialogContent>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            Hành động này sẽ cập nhật trọng số của Model dựa trên các đánh giá mới của bác sĩ.
                        </Typography>
                        <Alert severity="warning" variant="outlined" sx={{ borderRadius: '12px' }}>
                            Quá trình có thể mất 10-30 giây. <b>Vui lòng không đóng trình duyệt.</b>
                        </Alert>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setOpenDialog(false)} sx={{ fontWeight: 700 }}>Hủy</Button>
                        <Button 
                            variant="contained" 
                            onClick={() => handleRetrain(retrainType)}
                            sx={{ borderRadius: '10px', bgcolor: '#1e293b', fontWeight: 700 }}
                        >
                            Bắt đầu huấn luyện
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Fade>
    );
};

export default AdminDashboard;