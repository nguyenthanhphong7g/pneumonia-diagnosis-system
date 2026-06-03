import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { alpha } from '@mui/material/styles';
import { RateReview as RateReviewIcon } from '@mui/icons-material';
    import {
        Typography, Card, CardContent, Box,
        CircularProgress, Grid, Chip, Divider, Dialog,
        DialogTitle, DialogContent, DialogActions,
        Button, Paper, IconButton, TextField, InputAdornment, MenuItem,
        Select, FormControl, InputLabel,
        Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination
    } from '@mui/material';

import {
    CheckCircle as CheckCircleIcon,
    WarningAmber as WarningIcon,
    Close as CloseIcon,
    History as HistoryIcon,
    FactCheck as FactCheckIcon,
    AutoAwesome as AiIcon,
    Search as SearchIcon,
    FilterAlt as FilterIcon,
    ImageOutlined as ImageIcon,
    CheckCircleOutlined as VerifiedIcon
} from '@mui/icons-material';
import { apiUrl } from '../config/api';
import DiagnosisMediaViewer from '../components/DiagnosisMediaViewer';
import { formatModelName, resolveModelName } from '../utils/diagnosisDisplay';
import { exportDoctorReviewPdf, viewDoctorReport } from '../utils/diagnosisReportPdf';

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
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    // Pagination handlers
    const handlePageChange = (event, newPage) => setPage(newPage);
    const handleRowsPerPageChange = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

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

    // Pagination data
    const paginatedCases = filteredCases.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
        


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
                            <MenuItem value="all">Tất cả Mô hình</MenuItem>
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
                                <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <Table sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                        <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Thời gian</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>Hình ảnh</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>Kết quả AI</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>Mô hình</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>Trạng thái</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', pr: 4 }}>Thao tác</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {paginatedCases.map((item) => (
                                                <TableRow key={item.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                    <TableCell sx={{ color: '#1e293b', fontWeight: 500 }}>{new Date(item.reviewedAt).toLocaleDateString('vi-VN')}</TableCell>
                                                    <TableCell align="center">
                                                        <Box sx={{ width: 60, height: 60, borderRadius: '12px', overflow: 'hidden', mx: 'auto', border: '2px solid #f1f5f9' }}>
                                                            <img src={getImagePath(item.diagnosis?.imagePath)} alt="X-quang" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip label={item.diagnosis?.label === 'Pneumonia' ? 'Viêm phổi' : 'Bình thường'}
                                                            color={item.diagnosis?.label === 'Pneumonia' ? 'error' : 'success'} size="small"
                                                            sx={{ fontWeight: 800, backdropFilter: 'blur(4px)' }} />
                                                        <Typography variant="caption" display="block" sx={{ mt: 0.5, color: '#94a3b8', fontWeight: 600 }}>{(item.diagnosis?.confidence * 100).toFixed(1)}%</Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip label={getModelName(item.diagnosis)} variant="outlined" size="small"
                                                            sx={{ fontWeight: 700, borderStyle: 'dashed' }} />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {item.finalLabel === item.diagnosis?.label ? (
                                                            <Chip label="Đồng thuận" sx={{ bgcolor: '#d1fae5', color: '#065f46', fontWeight: 700 }} />
                                                        ) : (
                                                            <Chip label="Không đồng thuận" sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 700 }} />
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ pr: 4 }}>
                                                        <IconButton onClick={() => setSelectedReview(item)} sx={{ color: '#2563eb', bgcolor: alpha('#2563eb', 0.05) }}>
                                                            <RateReviewIcon fontSize="small" />
                                                        </IconButton>
                                                        {/* <Button variant="outlined" onClick={() => exportDoctorReport(item)} sx={{ borderRadius: '8px', marginLeft: 1 }}>
                                                            Xuất PDF
                                                        </Button> */}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <TablePagination
                                        component="div"
                                        count={filteredCases.length}
                                        page={page}
                                        onPageChange={handlePageChange}
                                        rowsPerPage={rowsPerPage}
                                        onRowsPerPageChange={handleRowsPerPageChange}
                                        rowsPerPageOptions={[5, 10, 25]}
                                        labelRowsPerPage="Số dòng"
                                    />
                                </TableContainer>
                        )}
                    </Box>
                )}
            </Box>

            <Dialog
                open={!!selectedReview}
                onClose={() => setSelectedReview(null)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#1e293b', pb: 1 }}>
                    Hồ sơ ca bệnh
                </DialogTitle>

                <DialogContent>
                    {selectedReview && (
                        <Box sx={{ mt: 1 }}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { md: '1fr 1fr' }, gap: 3 }}>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ImageIcon fontSize="small" /> Hình ảnh X-quang
                                    </Typography>
                                    <DiagnosisMediaViewer
                                        originalSrc={getImagePath(selectedReview.diagnosis?.imagePath)}
                                        gradcamSrc={selectedReview.diagnosis?.gradcamPath ? apiUrl(selectedReview.diagnosis?.gradcamPath) : null}
                                        height={400}
                                    />
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ p: 2, borderRadius: '16px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                        <Typography variant="overline" sx={{ color: '#94a3b8', fontWeight: 800 }}>Kết quả AI</Typography>
                                        <Typography variant="h5" sx={{
                                            fontWeight: 900,
                                            color: selectedReview.diagnosis?.label === 'Pneumonia' ? '#ef4444' : '#10b981'
                                        }}>
                                            {selectedReview.diagnosis?.label === 'Pneumonia' ? 'VIÊM PHỔI' : 'BÌNH THƯỜNG'}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                                            Độ tin cậy: <strong>{(selectedReview.diagnosis?.confidence * 100).toFixed(2)}%</strong>
                                        </Typography>
                                    </Box>

                                    <Box sx={{ p: 2, borderRadius: '16px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                        <Typography variant="overline" sx={{ color: '#94a3b8', fontWeight: 800 }}>Mô hình sử dụng</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 800, color: '#1e293b' }}>
                                            {getModelName(selectedReview.diagnosis)}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ p: 2, borderRadius: '16px', bgcolor: alpha('#10b981', 0.05), border: '1px solid', borderColor: '#10b981' }}>
                                        <Typography variant="overline" sx={{ color: '#059669', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <VerifiedIcon sx={{ fontSize: 16 }} />
                                            Ý kiến chuyên gia
                                        </Typography>

                                        <Typography variant="body1" sx={{ fontWeight: 700, mt: 1, color: '#1e293b' }}>
                                            Kết luận: {selectedReview.finalLabel === 'Pneumonia' ? 'Viêm phổi' : 'Bình thường'}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: '#475569' }}>
                                            "{selectedReview.doctorComment || 'Bác sĩ không để lại lời nhắn.'}"
                                        </Typography>
                                        <Divider sx={{ my: 1.5, opacity: 0.5 }} />
                                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                                            Bác sĩ xác nhận: <strong>{selectedReview.doctorName ? selectedReview.doctorName : selectedReview.doctorId ? `Mã bác sĩ: ${selectedReview.doctorId}` : 'Không xác định'}</strong>
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, display: 'flex', gap: 2 }}>
                    <Button
                        onClick={() => exportDoctorReport(selectedReview)}
                        variant="outlined"
                        sx={{ flex: 1, borderRadius: '10px', px: 3, borderColor: '#0f766e', color: '#0f766e', '&:hover': { borderColor: '#115e59', bgcolor: '#f0fdfa' } }}
                    >
                        Xuất báo cáo PDF
                    </Button>
                    <Button onClick={() => setSelectedReview(null)} sx={{ color: '#64748b', fontWeight: 700, px: 3 }}>
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default DoctorHistory;