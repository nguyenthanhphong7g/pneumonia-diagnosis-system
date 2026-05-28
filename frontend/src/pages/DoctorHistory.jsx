import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Typography, Card, CardContent, Box,
    CircularProgress, Grid, Chip, Divider, Dialog,
    Button, Paper, IconButton, TextField, InputAdornment, MenuItem,
    Select, FormControl, InputLabel
} from '@mui/material';

import {
    CheckCircle as CheckCircleIcon,
    WarningAmber as WarningIcon,
    Close as CloseIcon,
    History as HistoryIcon,
    FactCheck as FactCheckIcon,
    AutoAwesome as AiIcon,
    Search as SearchIcon,
    FilterAlt as FilterIcon
} from '@mui/icons-material';
import { apiUrl } from '../config/api';
import DiagnosisMediaViewer from '../components/DiagnosisMediaViewer';
import { formatModelName, resolveModelName } from '../utils/diagnosisDisplay';
import { exportDoctorReviewPdf } from '../utils/diagnosisReportPdf';

function DoctorHistory() {
    const navigate = useNavigate();
    const [reviewedCases, setReviewedCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedReview, setSelectedReview] = useState(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLabel, setFilterLabel] = useState('all');
    const [filterConsistency, setFilterConsistency] = useState('all');
    const [filterModel, setFilterModel] = useState('all');
    const [filterDate, setFilterDate] = useState('');

    const exportDoctorReport = async (record) => {
        return exportDoctorReviewPdf(record);
    };

    const fetchReviewHistory = async () => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            setError('Bạn chưa đăng nhập.');
            setLoading(false);
            return;
        }

        try {
            const res = await axios.get(apiUrl('/api/review/my-history'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReviewedCases(res.data || []);
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

    const getModelName = (record) => formatModelName(resolveModelName(record?.modelName, record?.model, record?.aiModel, record?.model_name));

    const filteredCases = reviewedCases.filter(item => {
        const matchesSearch = item.diagnosis?.id?.toString().includes(searchTerm) ||
            item.finalLabel?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLabel = filterLabel === 'all' || item.finalLabel?.toLowerCase() === filterLabel.toLowerCase();
        const matchesConsistency = filterConsistency === 'all' ||
            (filterConsistency === 'agree' && item.diagnosis?.label === item.finalLabel) ||
            (filterConsistency === 'disagree' && item.diagnosis?.label !== item.finalLabel);

        // Lọc theo Model
        const modelName = getModelName(item.diagnosis).toLowerCase();
        const matchesModel = filterModel === 'all' || modelName.includes(filterModel.toLowerCase());

        // Lọc theo Ngày
        const matchesDate = !filterDate || (item.reviewDate && item.reviewDate.startsWith(filterDate));

        return matchesSearch && matchesLabel && matchesConsistency && matchesModel && matchesDate;
    });

    const getImagePath = (path) => {
        if (!path) return "https://via.placeholder.com/400x300?text=No+Image";
        return apiUrl(path);
    };

    if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 8, color: '#2563eb' }} />;

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 5, px: { xs: 2, md: 4 } }}>
            <Box sx={{ maxWidth: '1200px', mx: 'auto', mb: 6 }}>
                <Paper
                    elevation={0}
                    sx={{
                        position: 'relative',
                        p: { xs: 3, md: 4 },
                        borderRadius: '30px',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                        border: '1px solid #bbf7d0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: 2,
                        overflow: 'hidden'
                    }}
                >
                    {/* Decor background */}
                    <AiIcon sx={{ position: 'absolute', right: -20, top: -20, fontSize: 200, color: '#16a34a', opacity: 0.03 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, position: 'relative', zIndex: 1 }}>
                        <Box sx={{
                            bgcolor: '#16a34a',
                            p: 2,
                            borderRadius: '20px',
                            display: 'flex',
                            boxShadow: '0 8px 16px -4px rgba(22, 163, 74, 0.4)'
                        }}>
                            <HistoryIcon sx={{ color: '#fff', fontSize: '2rem' }} />
                        </Box>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b', letterSpacing: '-0.5px' }}>
                                Lịch sử đánh giá
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
                                Theo dõi các ca bệnh đã hoàn thành chẩn đoán
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ textAlign: { xs: 'left', md: 'right' }, minWidth: { xs: 'auto', md: '180px' }, position: 'relative', zIndex: 1 }}>
                        <Typography variant="h2" sx={{ fontWeight: 950, color: '#16a34a', lineHeight: 0.8, mb: 1 }}>
                            {reviewedCases.length}
                        </Typography>
                        <Chip
                            label="Đã hoàn thành"
                            sx={{ fontWeight: 800, bgcolor: '#dcfce7', color: '#166534', borderRadius: '10px' }}
                        />
                    </Box>
                </Paper>
            </Box>

            <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
                {/* FILTER SECTION */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 2.5,
                        mb: 4,
                        borderRadius: '20px',
                        border: '1px solid #e2e8f0',
                        bgcolor: '#fff',
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: 2,
                        alignItems: 'center'
                    }}
                >
                    <TextField
                        placeholder="Tìm theo ID ca bệnh..."
                        size="small"
                        fullWidth
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#94a3b8' }} />
                                </InputAdornment>
                            ),
                            sx: { borderRadius: '12px', bgcolor: '#f8fafc' }
                        }}
                    />

                    <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 200 } }}>
                        <InputLabel sx={{ fontWeight: 600 }}>Kết quả</InputLabel>
                        <Select
                            value={filterLabel}
                            label="Kết quả"
                            onChange={(e) => setFilterLabel(e.target.value)}
                            sx={{ borderRadius: '12px', bgcolor: '#f8fafc', fontWeight: 700 }}
                        >
                            <MenuItem value="all">Tất cả kết quả</MenuItem>
                            <MenuItem value="Pneumonia">Viêm phổi</MenuItem>
                            <MenuItem value="Normal">Bình thường</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 220 } }}>
                        <InputLabel sx={{ fontWeight: 600 }}>Độ đồng thuận AI</InputLabel>
                        <Select
                            value={filterConsistency}
                            label="Độ đồng thuận AI"
                            onChange={(e) => setFilterConsistency(e.target.value)}
                            sx={{ borderRadius: '12px', bgcolor: '#f8fafc', fontWeight: 700 }}
                        >
                            <MenuItem value="all">Mọi trạng thái</MenuItem>
                            <MenuItem value="agree">Bác sĩ & AI đồng thuận</MenuItem>
                            <MenuItem value="disagree">Bác sĩ khác AI</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 180 } }}>
                        <InputLabel sx={{ fontWeight: 600 }}>Mô hình AI</InputLabel>
                        <Select
                            value={filterModel}
                            label="Mô hình AI"
                            onChange={(e) => setFilterModel(e.target.value)}
                            sx={{ borderRadius: '12px', bgcolor: '#f8fafc', fontWeight: 700 }}
                        >
                            <MenuItem value="all">Tất cả Model</MenuItem>
                            <MenuItem value="DenseNet">DenseNet169</MenuItem>
                            <MenuItem value="Fusion">Gated Fusion</MenuItem>
                            <MenuItem value="ViT">Vision Transformer (ViT)</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        type="date"
                        size="small"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        sx={{
                            minWidth: { xs: '100%', md: 160 },
                            '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#f8fafc' }
                        }}
                        InputLabelProps={{ shrink: true }}
                    />
                </Paper>

                {error ? (
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '24px' }}>
                        <Typography color="error" sx={{ fontWeight: 700 }}>{error}</Typography>
                        <Button variant="outlined" onClick={fetchReviewHistory} sx={{ mt: 2 }}>Tải lại</Button>
                    </Paper>
                ) : (
                    <Box>
                        {reviewedCases.length === 0 ? (
                            <Paper sx={{ p: 8, textAlign: 'center', borderRadius: '30px', border: '2px dashed #e2e8f0', bgcolor: 'transparent' }}>
                                <FactCheckIcon sx={{ fontSize: '4rem', color: '#cbd5e1', mb: 2 }} />
                                <Typography sx={{ color: '#64748b', fontWeight: 700, fontSize: '1.2rem' }}>
                                    Bạn chưa thực hiện đánh giá bất kỳ ca bệnh nào.
                                </Typography>
                            </Paper>
                        ) : (
                            <Grid container spacing={3.5}>
                                {filteredCases.map((item) => (
                                    <Grid item xs={12} sm={6} lg={4} key={item.id}>
                                        <Card sx={{
                                            borderRadius: '24px',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            transition: 'all 0.4s ease',
                                            border: '1px solid #f1f5f9',
                                            overflow: 'hidden',
                                            '&:hover': {
                                                transform: 'translateY(-10px)',
                                                boxShadow: '0 20px 40px -12px rgba(0,0,0,0.1)'
                                            }
                                        }}>
                                            <Box sx={{ height: '240px', width: '100%', bgcolor: '#000', position: 'relative' }}>
                                                <img
                                                    src={getImagePath(item.diagnosis?.imagePath)}
                                                    alt="X-quang"
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                />
                                                <Chip
                                                    label={item.diagnosis?.label === item.finalLabel ? 'Đồng thuận' : 'Khác AI'}
                                                    sx={{
                                                        position: 'absolute', top: 12, right: 12,
                                                        fontWeight: 800,
                                                        bgcolor: item.diagnosis?.label === item.finalLabel ? 'rgba(34, 197, 94, 0.9)' : 'rgba(245, 158, 11, 0.9)',
                                                        color: '#fff'
                                                    }}
                                                />
                                            </Box>
                                            <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>Kết quả bác sĩ</Typography>
                                                <Typography variant="h5" sx={{ fontWeight: 900, color: item.finalLabel === 'Pneumonia' ? '#e11d48' : '#16a34a', mb: 1 }}>
                                                    {item.finalLabel === 'Pneumonia' ? 'VIÊM PHỔI' : 'BÌNH THƯỜNG'}
                                                </Typography>
                                                <Box sx={{ mt: 'auto', pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 700 }}>
                                                        {new Date(item.reviewedAt).toLocaleDateString('vi-VN')}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <Button variant="outlined" onClick={() => exportDoctorReport(item)} sx={{ borderRadius: '10px', borderColor: '#0f766e', color: '#0f766e', fontWeight: 800, '&:hover': { borderColor: '#115e59', bgcolor: '#f0fdfa' } }}>Xuất PDF</Button>
                                                        <Button variant="contained" onClick={() => setSelectedReview(item)} sx={{ borderRadius: '10px', bgcolor: '#f1f5f9', color: '#1e293b', fontWeight: 800 }}>Chi tiết</Button>
                                                    </Box>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Box>
                )}
            </Box>

            <Dialog
                open={!!selectedReview}
                onClose={() => setSelectedReview(null)}
                maxWidth="lg"
                fullWidth
                PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden', maxHeight: '90vh', bgcolor: '#000' } }}
            >
                {selectedReview && (
                    <Box sx={{ position: 'relative', width: '100%', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'stretch' }}>
                        <Box sx={{ width: { xs: '100%', md: '60%' }, bgcolor: '#000' }}>
                            <Box sx={{ width: '100%' }}>
                                <DiagnosisMediaViewer
                                    originalSrc={getImagePath(selectedReview.diagnosis?.imagePath)}
                                    gradcamSrc={selectedReview.diagnosis?.gradcamPath ? apiUrl(selectedReview.diagnosis?.gradcamPath) : null}
                                    height="auto"
                                />
                            </Box>
                        </Box>
                        <Box sx={{ width: { xs: '100%', md: '40%' }, bgcolor: '#ffffff', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #e2e8f0' }}>
                            <Box sx={{ p: 4, flexGrow: 1, overflowY: 'auto', maxHeight: '85vh' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                    <IconButton onClick={() => setSelectedReview(null)} size="small" sx={{ bgcolor: '#f1f5f9' }}>
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5 }}>Hồ sơ ca bệnh</Typography>
                                <Typography variant="caption" sx={{ color: '#64748b', mb: 4, display: 'block' }}>
                                    Ca ID: #{selectedReview.diagnosis?.id} • {new Date(selectedReview.reviewedAt).toLocaleDateString('vi-VN')}
                                </Typography>

                                <Grid container spacing={2} sx={{ mb: 4 }}>
                                    <Grid item xs={12}>
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: '16px' }}>
                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>AI DỰ ĐOÁN</Typography>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{selectedReview.diagnosis?.label === 'Pneumonia' ? 'Viêm phổi' : 'Bình thường'}</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: '16px', bgcolor: '#f0fdf4' }}>
                                            <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700 }}>BÁC SĨ XÁC NHẬN</Typography>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{selectedReview.finalLabel === 'Pneumonia' ? 'Viêm phổi' : 'Bình thường'}</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: '16px' }}>
                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>MODEL</Typography>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{getModelName(selectedReview.diagnosis)}</Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>

                                <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 800, mb: 1.5 }}>NHẬN XÉT LÂM SÀNG</Typography>
                                <Paper variant="outlined" sx={{ p: 2, borderRadius: '16px', bgcolor: '#f8fafc', minHeight: '100px' }}>
                                    <Typography variant="body2">{selectedReview.doctorComment || "Không có ghi chú."}</Typography>
                                </Paper>

                                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                                    <Button variant="outlined" onClick={() => exportDoctorReport(selectedReview)} sx={{ flex: 1, py: 1.5, borderRadius: '14px', borderColor: '#0f766e', color: '#0f766e', fontWeight: 800, '&:hover': { borderColor: '#115e59', bgcolor: '#f0fdfa' } }}>Xuất báo cáo PDF</Button>
                                    <Button variant="contained" onClick={() => setSelectedReview(null)} sx={{ flex: 1, py: 1.5, borderRadius: '14px', bgcolor: '#1e293b', color: '#fff' }}>Đóng hồ sơ</Button>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                )}
            </Dialog>
        </Box>
    );
}

export default DoctorHistory;