import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Typography, Card, CardContent, Box, Alert,
    CircularProgress, Grid, Chip, Divider, Dialog,
    Button, Paper, IconButton, Zoom
} from '@mui/material';

import {
    CheckCircle as CheckCircleIcon,
    WarningAmber as WarningIcon,
    Close as CloseIcon,
    History as HistoryIcon,
    Visibility as VisibilityIcon,
    FactCheck as FactCheckIcon
} from '@mui/icons-material';

function DoctorHistory() {
    const [reviewedCases, setReviewedCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedReview, setSelectedReview] = useState(null);

    const fetchReviewHistory = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Bạn chưa đăng nhập.');
            setLoading(false);
            return;
        }

        try {
            const res = await axios.get('http://localhost:8080/api/review/my-history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReviewedCases(res.data || []);
            if ((res.data || []).length === 0) setError(null);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Không thể tải lịch sử review');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviewHistory();
    }, []);

    const getImagePath = (path) => {
        if (!path) return "https://via.placeholder.com/400x300?text=No+Image";
        return path.startsWith('http') ? path : `http://localhost:8080${path}`;
    };

    if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 8, color: '#2563eb' }} />;

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 5, px: { xs: 2, md: 8 } }}>
            
            {/* HEADER ĐỒNG BỘ STYLE PRO */}
            <Box sx={{ position: 'relative', mb: 6 }}>
                <Paper 
                    elevation={0}
                    sx={{ 
                        p: 4, 
                        borderRadius: '30px', 
                        background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                        border: '1px solid #bbf7d0',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        overflow: 'hidden'
                    }}
                >
                    <FactCheckIcon sx={{ position: 'absolute', right: -20, top: -20, fontSize: 200, color: '#16a34a', opacity: 0.05 }} />
                    
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Box sx={{ bgcolor: '#16a34a', p: 1, borderRadius: '12px', display: 'flex' }}>
                                <HistoryIcon sx={{ color: '#fff', fontSize: 30 }} />
                            </Box>
                            <Typography variant="h3" sx={{ fontWeight: 900, color: '#1e293b', letterSpacing: '-1.5px' }}>
                                Lịch sử <Box component="span" sx={{ color: '#16a34a' }}>Đã duyệt</Box>
                            </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 500, maxWidth: '550px', lineHeight: 1.5 }}>
                            Danh sách các ca chẩn đoán AI mà bạn đã kiểm tra và <Box component="span" sx={{ color: '#15803d', fontWeight: 700 }}>xác nhận</Box>.
                        </Typography>
                    </Box>
                    
                    <Box sx={{ textAlign: 'right', minWidth: '150px' }}>
                        <Typography variant="h2" sx={{ fontWeight: 950, color: '#16a34a', lineHeight: 0.8, mb: 1 }}>
                            {reviewedCases.length}
                        </Typography>
                        <Chip label="Ca đã hoàn tất" sx={{ fontWeight: 800, bgcolor: '#dcfce7', color: '#166534', borderRadius: '8px' }} />
                    </Box>
                </Paper>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 4, borderRadius: '16px', fontWeight: 600 }}>{error}</Alert>}

{/* DANH SÁCH CA BỆNH */}
{/* BOX NGOÀI CÙNG: Giảm px từ 8 xuống 3 để lấy thêm chỗ cho thẻ to ra */}
<Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 5, px: { xs: 2, md: 3 } }}>
    
    {/* ... Phần Header giữ nguyên ... */}

    {/* DANH SÁCH CA BỆNH */}
    {reviewedCases.length === 0 ? (
        <Paper sx={{ textAlign: 'center', py: 10, borderRadius: '24px', border: '1px dashed #cbd5e1', bgcolor: 'transparent', boxShadow: 'none' }}>
            <HistoryIcon sx={{ fontSize: 80, color: '#cbd5e1', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#475569' }}>Chưa có ca review nào</Typography>
        </Paper>
    ) : (
        /* Sử dụng maxWidth="xl" để Grid có thể nở rộng tối đa, giúp thẻ to ra */
        <Box sx={{ maxWidth: '1400px', mx: 'auto' }}> 
            <Grid container spacing={3}>
                {reviewedCases.map((item) => (
                    /* Cấu hình cột: md={4} là 3 thẻ/hàng, sm={6} là 2 thẻ/hàng */
                    <Grid item xs={12} sm={6} md={4} key={item.id} sx={{ display: 'flex' }}>
                        <Zoom in={true}>
                            <Card sx={{ 
                                width: '100%', 
                                borderRadius: '28px', // Bo tròn mạnh hơn cho giống trang review
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.3s ease',
                                '&:hover': { transform: 'translateY(-10px)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }
                            }}>
                                {/* ẢNH: Tăng lên 240px để thẻ to và rõ như trang review */}
                                <Box sx={{ height: 240, bgcolor: '#000', position: 'relative', overflow: 'hidden' }}>
                                    <img 
                                        src={getImagePath(item.imagePath)} 
                                        alt="X-quang" 
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                                    />
                                    <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                                        <Chip 
                                            label={item.label === item.finalLabel ? 'Đồng thuận AI' : 'Khác AI'} 
                                            sx={{ 
                                                fontWeight: 800, 
                                                bgcolor: item.label === item.finalLabel ? 'rgba(34, 197, 94, 0.95)' : 'rgba(245, 158, 11, 0.95)',
                                                color: '#fff',
                                                backdropFilter: 'blur(4px)'
                                            }}
                                        />
                                    </Box>
                                </Box>

                                {/* NỘI DUNG THẺ */}
                                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, mb: 1, textTransform: 'uppercase' }}>
                                        Kết quả chẩn đoán
                                    </Typography>
                                    
                                    <Typography variant="h5" sx={{ fontWeight: 900, color: item.finalLabel === 'Pneumonia' ? '#e11d48' : '#16a34a', mb: 2 }}>
                                        {item.finalLabel === 'Pneumonia' ? 'VIÊM PHỔI' : 'BÌNH THƯỜNG'}
                                    </Typography>

                                    <Box sx={{ mb: 3 }}>
                                        <Chip 
                                            icon={item.label === 'Pneumonia' ? <WarningIcon fontSize="small"/> : <CheckCircleIcon fontSize="small"/>}
                                            label={`AI dự đoán: ${item.label === 'Pneumonia' ? 'Viêm phổi' : 'Bình thường'}`}
                                            variant="outlined"
                                            sx={{ fontWeight: 600, color: '#475569' }}
                                        />
                                    </Box>

                                    {/* FOOTER: Đẩy xuống dưới cùng */}
                                    <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Ngày thực hiện</Typography>
                                            <Typography variant="body2" sx={{ color: '#475569', fontWeight: 700 }}>
                                                {new Date(item.reviewedAt).toLocaleDateString('vi-VN')}
                                            </Typography>
                                        </Box>
                                        
                                        <Button
                                            variant="contained"
                                            onClick={() => setSelectedReview(item)}
                                            sx={{ 
                                                borderRadius: '12px', 
                                                bgcolor: '#f1f5f9', 
                                                color: '#1e293b',
                                                fontWeight: 800,
                                                boxShadow: 'none',
                                                textTransform: 'none',
                                                '&:hover': { bgcolor: '#e2e8f0', boxShadow: 'none' } 
                                            }}
                                        >
                                            Xem chi tiết
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Zoom>
                    </Grid>
                ))}
            </Grid>
        </Box>
    )}
</Box>

            {/* DIALOG CHI TIẾT LỊCH SỬ - BỐ CỤC SIDE-BY-SIDE (7/5) */}
            <Dialog
                open={!!selectedReview}
                onClose={() => setSelectedReview(null)}
                maxWidth="lg"
                fullWidth
                PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden', maxHeight: '85vh' } }}
            >
                {selectedReview && (
                    <Grid container sx={{ height: '100%' }}>
                        {/* CỘT ẢNH */}
                        <Grid item xs={12} md={7} sx={{ bgcolor: '#000', display: 'flex' }}>
                            <Box sx={{ width: '100%', height: '100%', minHeight: { xs: 300, md: '85vh' }, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1 }}>
                                <img
                                    src={getImagePath(selectedReview.imagePath)}
                                    alt="X-quang chi tiết"
                                    style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                                />
                            </Box>
                        </Grid>

                        {/* CỘT THÔNG TIN */}
                        <Grid item xs={12} md={5} sx={{ display: 'flex', flexDirection: 'column', bgcolor: '#ffffff' }}>
                            <Box sx={{ p: { xs: 3, md: 4 }, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
                                
                                {/* Tiêu đề Dialog */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                                    <Box>
                                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', mb: 0.5 }}>Hồ sơ ca bệnh</Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, bgcolor: '#f1f5f9', px: 1, py: 0.5, borderRadius: 1 }}>
                                            Ca ID: #{selectedReview.id} • Duyệt lúc: {new Date(selectedReview.reviewedAt).toLocaleString('vi-VN')}
                                        </Typography>
                                    </Box>
                                    <IconButton onClick={() => setSelectedReview(null)} size="small" sx={{ bgcolor: '#f1f5f9' }}>
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </Box>

                                {/* Bảng So sánh AI vs Bác sĩ */}
                                <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', mb: 1.5, letterSpacing: '0.5px' }}> Đối chiếu kết quả </Typography>
                                <Grid container spacing={2} sx={{ mb: 4 }}>
                                    <Grid item xs={6}>
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: '16px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', height: '100%' }}>
                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, mb: 1, display: 'block' }}>AI DỰ ĐOÁN</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {selectedReview.label === 'Pneumonia' ? <WarningIcon color="error" /> : <CheckCircleIcon color="success" />}
                                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: selectedReview.label === 'Pneumonia' ? '#e11d48' : '#16a34a' }}>
                                                    {selectedReview.label === 'Pneumonia' ? 'Viêm phổi' : 'Bình thường'}
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, mt: 0.5, display: 'block' }}>
                                                Độ tin cậy: {(selectedReview.confidence * 100).toFixed(1)}%
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: '16px', bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', height: '100%' }}>
                                            <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700, mb: 1, display: 'block' }}>BẠN XÁC NHẬN</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {selectedReview.finalLabel === 'Pneumonia' ? <WarningIcon color="error" /> : <CheckCircleIcon sx={{color: '#16a34a'}} />}
                                                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: selectedReview.finalLabel === 'Pneumonia' ? '#e11d48' : '#16a34a' }}>
                                                    {selectedReview.finalLabel === 'Pneumonia' ? 'Viêm phổi' : 'Bình thường'}
                                                </Typography>
                                            </Box>
                                            <Chip 
                                                label={selectedReview.label === selectedReview.finalLabel ? 'Đồng thuận' : 'Hiệu chỉnh'} 
                                                size="small" 
                                                sx={{ mt: 1, height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: selectedReview.label === selectedReview.finalLabel ? '#dcfce7' : '#ffedd5', color: selectedReview.label === selectedReview.finalLabel ? '#166534' : '#c2410c' }} 
                                            />
                                        </Paper>
                                    </Grid>
                                </Grid>

                                <Divider sx={{ mb: 4 }} />

                                {/* Ghi chú của bác sĩ */}
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', mb: 1.5, letterSpacing: '0.5px' }}> Nhận xét lâm sàng </Typography>
                                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', minHeight: '120px' }}>
                                        {selectedReview.doctorComment ? (
                                            <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                                {selectedReview.doctorComment}
                                            </Typography>
                                        ) : (
                                            <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                                Không có ghi chú nào được lưu cho ca này.
                                            </Typography>
                                        )}
                                    </Paper>
                                </Box>

                                {/* Footer Button */}
                                <Box sx={{ mt: 4 }}>
                                    <Button 
                                        variant="outlined" 
                                        fullWidth 
                                        size="large"
                                        onClick={() => setSelectedReview(null)}
                                        sx={{ py: 1.5, borderRadius: '14px', textTransform: 'none', fontWeight: 800, color: '#475569', borderColor: '#cbd5e1' }}
                                    >
                                        Đóng hồ sơ
                                    </Button>
                                </Box>
                                
                            </Box>
                        </Grid>
                    </Grid>
                )}
            </Dialog>
        </Box>
    );
}

export default DoctorHistory;