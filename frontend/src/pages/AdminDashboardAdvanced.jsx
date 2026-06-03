import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Import MUI Components
import {
    Box, Card, CardContent, Typography, Button, Grid, LinearProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
    Chip, Divider, Tabs, Tab, Stack, IconButton, TablePagination,
    TextField, InputAdornment, MenuItem, FormControl, Select, InputLabel
} from '@mui/material';

// Import MUI Icons - Dùng cách an toàn nhất
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import BarChartOutlined from '@mui/icons-material/BarChartOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import WarningOutlined from '@mui/icons-material/WarningOutlined';
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AnalyticsOutlined from '@mui/icons-material/AnalyticsOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import AssessmentOutlined from '@mui/icons-material/AssessmentOutlined';
import RateReviewOutlined from '@mui/icons-material/RateReviewOutlined';
import HistoryEduOutlined from '@mui/icons-material/HistoryEduOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import FilterAltOutlined from '@mui/icons-material/FilterAltOutlined';

// Kiểm tra kỹ đường dẫn này, nếu file UserManagement.jsx nằm cùng thư mục components thì đúng
import UserManagement from '../components/UserManagement';
import ToastNotification from '../components/ToastNotification';
import { API_BASE_URL } from '../config/api';
import DiagnosisMediaViewer from '../components/DiagnosisMediaViewer';
import { formatModelName, resolveModelName } from '../utils/diagnosisDisplay';
const AdminDashboardAdvanced = () => {
    const [stats, setStats] = useState(null);
    const [unusedReviews, setUnusedReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [retraining, setRetraining] = useState(false);
    const [message, setMessage] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [retrainType, setRetrainType] = useState(null);
    const [retrainHistory, setRetrainHistory] = useState([]);
    const [activeTab, setActiveTab] = useState(0);

    // Diagnosis statistics states
    const [diagnosisStats, setDiagnosisStats] = useState(null);
    const [diagnoses, setDiagnoses] = useState([]);
    const [selectedPatientDetails, setSelectedPatientDetails] = useState(null);
    const [detailsDialog, setDetailsDialog] = useState(false);
    const [diagnosisPage, setDiagnosisPage] = useState(0);
    const [diagnosisRowsPerPage, setDiagnosisRowsPerPage] = useState(10);
    const [pendingPage, setPendingPage] = useState(0);
    const [pendingRowsPerPage, setPendingRowsPerPage] = useState(5);
    const [historyPage, setHistoryPage] = useState(0);
    const [historyRowsPerPage, setHistoryRowsPerPage] = useState(5);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLabel, setFilterLabel] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterModel, setFilterModel] = useState('all');
    const [filterDate, setFilterDate] = useState('');

    const API_BASE = `${API_BASE_URL}/api`;

    // Load stats
    useEffect(() => {
        loadStats();
        loadDiagnosisStats();
        loadRetrainHistory();
    }, []);

    const filteredDiagnoses = diagnoses.filter(d => {
        const matchesSearch = d.id?.toString().includes(searchTerm) ||
            d.imagePath?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLabel = filterLabel === 'all' || d.label === filterLabel;
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'reviewed' && d.reviewed) ||
            (filterStatus === 'pending' && !d.reviewed);

        // Lọc theo Model
        const modelName = formatModelName(resolveModelName(d?.modelName, d?.model, d?.aiModel, d?.model_name)).toLowerCase();
        const matchesModel = filterModel === 'all' || modelName.includes(filterModel.toLowerCase());

        // Lọc theo Ngày
        const matchesDate = !filterDate || (d.createdAt && d.createdAt.startsWith(filterDate));

        return matchesSearch && matchesLabel && matchesStatus && matchesModel && matchesDate;
    });

    // Auto refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            loadStats();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE}/admin/model-stats`);
            setStats(response.data);

            // Also load unused reviews
            const reviewsResponse = await axios.get(`${API_BASE}/admin/unused-reviews`);
            setUnusedReviews(reviewsResponse.data.reviews || []);
        } catch (error) {
            console.error('Error loading stats:', error);
            setMessage({
                type: 'error',
                text: 'Lỗi khi tải dữ liệu: ' + error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    const loadRetrainHistory = async () => {
        // Mock data - in production, fetch from backend
        setRetrainHistory([
            { id: 5, date: '2026-05-06', time: '14:30', type: 'unused', samples: 15, status: 'success' },
            { id: 4, date: '2026-05-05', time: '22:15', type: 'all', samples: 50, status: 'success' },
            { id: 3, date: '2026-05-04', time: '10:45', type: 'unused', samples: 10, status: 'success' },
            { id: 2, date: '2026-05-02', time: '14:20', type: 'unused', samples: 8, status: 'success' },
            { id: 1, date: '2026-05-01', time: '11:10', type: 'all', samples: 45, status: 'success' },
        ]);
    };

    const loadDiagnosisStats = async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) return;

            // Fetch all diagnoses with review info
            const res = await axios.get(`${API_BASE}/diagnosis-stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const diagnosisData = res.data || [];
            setDiagnoses(diagnosisData);
            // Calculate stats
            const stats = {
                total: diagnosisData.length,
                pneumonia: diagnosisData.filter(d => d.label === 'Pneumonia').length,
                normal: diagnosisData.filter(d => d.label === 'Normal').length,
                reviewed: diagnosisData.filter(d => d.reviewed).length,
                pending: diagnosisData.filter(d => !d.reviewed).length,
            };
            setDiagnosisStats(stats);
        } catch (error) {
            console.error('Error loading diagnosis stats:', error);
        }
    };

    const handleRetrain = async (type) => {
        setOpenDialog(false);
        setRetraining(true);
        setMessage(null);

        try {
            let response;
            if (type === 'unused') {
                response = await axios.post(`${API_BASE}/admin/retrain-unused`);
            } else {
                response = await axios.post(`${API_BASE}/admin/retrain-all`);
            }

            const newHistory = {
                id: retrainHistory.length + 1,
                date: new Date().toISOString().split('T')[0],
                time: new Date().toLocaleTimeString('vi-VN'),
                type: type,
                samples: response.data.samples_processed,
                status: 'success',
            };
            setRetrainHistory([newHistory, ...retrainHistory]);

            setMessage({
                type: 'success',
                text: '✅ ' + response.data.message + ' - đã xử lý ' + response.data.samples_processed + ' mẫu',
            });

            // Reload stats after retrain
            setTimeout(loadStats, 2000);
        } catch (error) {
            console.error('Error retraining:', error);
            setMessage({
                type: 'error',
                text: '❌ Lỗi khi huấn luyện lại: ' + (error.response?.data?.message || error.message),
            });
        } finally {
            setRetraining(false);
        }
    };

    const openRetrainDialog = (type) => {
        setRetrainType(type);
        setOpenDialog(true);
    };

    const getProgressPercentage = () => {
        if (!stats) return 0;
        return (stats.usedForTraining / stats.totalReviews) * 100;
    };

    const getClassDistribution = () => {
        if (!stats) return { pneumonia: 0, normal: 0 };
        return {
            pneumonia: stats.pneumoniaCount || 0,
            normal: stats.normalCount || 0,
        };
    };

    const getModelName = (record) => formatModelName(resolveModelName(record?.modelName, record?.model, record?.aiModel, record?.model_name));

    const buildApiPath = (path) => {
        if (!path) return null;
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    const paginatedDiagnoses = filteredDiagnoses.slice(
        diagnosisPage * diagnosisRowsPerPage,
        diagnosisPage * diagnosisRowsPerPage + diagnosisRowsPerPage
    );

    const paginatedPendingReviews = unusedReviews.slice(
        pendingPage * pendingRowsPerPage,
        pendingPage * pendingRowsPerPage + pendingRowsPerPage
    );

    const paginatedRetrainHistory = retrainHistory.slice(
        historyPage * historyRowsPerPage,
        historyPage * historyRowsPerPage + historyRowsPerPage
    );

    return (
        <Box sx={{ width: '100%', px: { xs: 1, sm: 1.5, md: 2 }, py: 2 }}>
            {/* Tabs */}
            <Box
                sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    mb: 3,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    px: 1 // Tạo khoảng cách nhẹ so với biên
                }}
            >
                <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        minHeight: 48,
                        '& .MuiTabs-indicator': {
                            display: 'none', // Ẩn thanh gạch chân mặc định để dùng phong cách mới
                        },
                        '& .MuiTabs-flexContainer': {
                            gap: 1, // Tạo khoảng cách giữa các tab
                        },
                        py: 1 // Padding dọc cho container
                    }}
                >
                    {[
                        { label: 'Huấn luyện mô hình', icon: <BarChartOutlined />, id: 0 },
                        { label: 'Quản lý người dùng', icon: <PersonAddIcon />, id: 1 },
                        { label: 'Thống kê chẩn đoán', icon: <AnalyticsOutlined />, id: 2 }
                    ].map((tab, index) => (
                        <Tab
                            key={tab.id}
                            label={tab.label}
                            icon={tab.icon}
                            iconPosition="start"
                            sx={{
                                minHeight: 40,
                                borderRadius: '8px', // Bo góc cho tab
                                textTransform: 'none', // Giữ nguyên chữ thường/hoa
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                transition: 'all 0.2s',
                                color: 'text.secondary',
                                '&.Mui-selected': {
                                    color: 'primary.main',
                                    backgroundColor: (theme) =>
                                        theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.2)' : '#e3f2fd',
                                },
                                '&:hover': {
                                    backgroundColor: 'action.hover',
                                },
                            }}
                        />
                    ))}
                </Tabs>
            </Box>

            {/* Tab 3: Diagnosis Statistics */}
            {activeTab === 2 && (
                <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
                    {/* Header Section */}
                    <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '-1px', mb: 0.5 }}>
                                Thống kê chẩn đoán
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
                                Dữ liệu được cập nhật theo thời gian thực
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            disableElevation
                            startIcon={<RefreshOutlined />}
                            onClick={loadDiagnosisStats}
                            sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, px: 3 }}
                        >
                            Làm mới
                        </Button>
                    </Box>

                    {/* Stats Grid */}
                    <Grid container spacing={0} sx={{ mb: 4, gap: 2 }}>
                        {[
                            { label: 'TỔNG CA', value: diagnosisStats?.total || 0, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)', icon: <AssessmentOutlined /> },
                            { label: 'VIÊM PHỔI', value: diagnosisStats?.pneumonia || 0, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)', icon: <WarningOutlined /> },
                            { label: 'BÌNH THƯỜNG', value: diagnosisStats?.normal || 0, color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', icon: <CheckCircleOutlined /> },
                            { label: 'ĐÃ DUYỆT / CHỜ DUYỆT', value: `${diagnosisStats?.reviewed || 0} / ${diagnosisStats?.pending || 0}`, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)', icon: <RateReviewOutlined /> },
                        ].map((item, index) => (
                            <Grid item xs={12} sm={6} md={3} key={index} sx={{ flex: '1 1 auto' }}>
                                <Card sx={{
                                    borderRadius: 4,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(0,0,0,0.05)' }
                                }}>
                                    <CardContent sx={{ p: 2.5 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: item.bg, color: item.color, display: 'flex' }}>
                                                {item.icon}
                                            </Box>
                                        </Box>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.5 }}>
                                            {item.label}
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', mt: 0.5 }}>
                                            {item.value}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Data Table */}
                    <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                        <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>Danh sách chẩn đoán</Typography>
                                <Typography variant="body2" color="text.secondary">{filteredDiagnoses.length} kết quả tìm được</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                                <TextField
                                    placeholder="Tìm ID hoặc tên file..."
                                    size="small"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchOutlined sx={{ fontSize: 20, color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                        sx: { borderRadius: 2, bgcolor: '#f8fafc', width: { xs: '100%', sm: 220 } }
                                    }}
                                />
                                <FormControl size="small" sx={{ minWidth: 150 }}>
                                    <InputLabel>Kết quả AI</InputLabel>
                                    <Select
                                        value={filterLabel}
                                        label="Kết quả AI"
                                        onChange={(e) => setFilterLabel(e.target.value)}
                                        sx={{ borderRadius: 2, bgcolor: '#f8fafc' }}
                                    >
                                        <MenuItem value="all">Tất cả</MenuItem>
                                        <MenuItem value="Pneumonia">Viêm phổi</MenuItem>
                                        <MenuItem value="Normal">Bình thường</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl size="small" sx={{ minWidth: 150 }}>
                                    <InputLabel>Trạng thái</InputLabel>
                                    <Select
                                        value={filterStatus}
                                        label="Trạng thái"
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        sx={{ borderRadius: 2, bgcolor: '#f8fafc' }}
                                    >
                                        <MenuItem value="all">Tất cả</MenuItem>
                                        <MenuItem value="reviewed">Đã duyệt</MenuItem>
                                        <MenuItem value="pending">Chưa duyệt</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl size="small" sx={{ minWidth: 150 }}>
                                    <InputLabel>Mô hình AI</InputLabel>
                                    <Select
                                        value={filterModel}
                                        label="Mô hình AI"
                                        onChange={(e) => setFilterModel(e.target.value)}
                                        sx={{ borderRadius: 2, bgcolor: '#f8fafc' }}
                                    >
                                        <MenuItem value="all">Tất cả mô hình</MenuItem>
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
                                        minWidth: 160,
                                        '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f8fafc' }
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Box>
                        </Box>
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>#</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Mô hình</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Kết quả AI</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Kết luận BS</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Bác sĩ</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Trạng thái</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Ngày tạo</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b' }}>Hành động</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {diagnoses.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                                                <Typography color="text.secondary">Chưa có dữ liệu chẩn đoán</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedDiagnoses.map((item, idx) => (
                                            <TableRow key={item.id || idx} hover sx={{ '&:last-child td': { border: 0 } }}>
                                                <TableCell sx={{ color: 'text.secondary' }}>{diagnosisPage * diagnosisRowsPerPage + idx + 1}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={getModelName(item)}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontWeight: 700, borderStyle: 'dashed' }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={(item.aiLabel || item.label) === 'Pneumonia' ? 'Viêm phổi' : 'Bình thường'}
                                                        size="small"
                                                        sx={{ fontWeight: 700, bgcolor: (item.aiLabel || item.label) === 'Pneumonia' ? '#fee2e2' : '#dcfce7', color: (item.aiLabel || item.label) === 'Pneumonia' ? '#ef4444' : '#10b981' }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {item.finalLabel ? (
                                                        <Typography variant="body2" sx={{ fontWeight: 600, color: item.finalLabel === 'Pneumonia' ? 'error.main' : 'success.main' }}>
                                                            {item.finalLabel === 'Pneumonia' ? 'Viêm phổi' : 'Bình thường'}
                                                        </Typography>
                                                    ) : '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.doctorName || '—'}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: 10,
                                                        bgcolor: item.reviewed ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                        color: item.reviewed ? 'primary.main' : 'warning.main'
                                                    }}>
                                                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor' }} />
                                                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                                            {item.reviewed ? 'ĐÃ DUYỆT' : 'CHỜ DUYỆT'}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                                                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '—'}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton size="small" onClick={() => { setSelectedPatientDetails(item); setDetailsDialog(true); }}>
                                                        <VisibilityOutlined fontSize="small" color="action" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            component="div"
                            count={diagnoses.length}
                            page={diagnosisPage}
                            onPageChange={(event, newPage) => setDiagnosisPage(newPage)}
                            rowsPerPage={diagnosisRowsPerPage}
                            onRowsPerPageChange={(event) => {
                                setDiagnosisRowsPerPage(parseInt(event.target.value, 10));
                                setDiagnosisPage(0);
                            }}
                            rowsPerPageOptions={[5, 10, 25]}
                            labelRowsPerPage="Số dòng"
                        />
                    </Card>

                    {/* Detail Dialog */}
                    <Dialog
                        open={detailsDialog}
                        onClose={() => setDetailsDialog(false)}
                        maxWidth="sm"
                        fullWidth
                        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
                    >
                        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Chi tiết ca bệnh</DialogTitle>
                        <DialogContent>
                            <Stack spacing={2} sx={{ mt: 1 }}>
                                {[
                                    { label: 'Mã định danh', value: selectedPatientDetails?.id },
                                    { label: 'Model sử dụng', value: getModelName(selectedPatientDetails) },
                                    { label: 'Kết quả AI', value: selectedPatientDetails?.aiLabel || selectedPatientDetails?.label, isBadge: true },
                                    { label: 'Bác sĩ kết luận', value: selectedPatientDetails?.finalLabel, highlight: true },
                                    { label: 'Người thực hiện', value: selectedPatientDetails?.doctorName },
                                    { label: 'Ghi chú chuyên môn', value: selectedPatientDetails?.doctorComment, isLongText: true },
                                    { label: 'Thời gian tạo', value: selectedPatientDetails?.createdAt ? new Date(selectedPatientDetails.createdAt).toLocaleString('vi-VN') : null },
                                ].map((row, i) => row.value && (
                                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: row.isLongText ? 'flex-start' : 'center', py: 1, borderBottom: '1px solid #f1f5f9' }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>{row.label}</Typography>
                                        <Typography variant="body2" sx={{
                                            fontWeight: 700,
                                            textAlign: 'right',
                                            maxWidth: '60%',
                                            color: row.highlight ? 'primary.main' : 'text.primary'
                                        }}>
                                            {row.value}
                                        </Typography>
                                    </Box>
                                ))}
                                {selectedPatientDetails && (
                                    <Box sx={{ pt: 1 }}>
                                        <DiagnosisMediaViewer
                                            originalSrc={buildApiPath(selectedPatientDetails.imagePath)}
                                            gradcamSrc={selectedPatientDetails.gradcamPath ? buildApiPath(selectedPatientDetails.gradcamPath) : null}
                                            height={320}
                                        />
                                    </Box>
                                )}
                            </Stack>
                        </DialogContent>
                        <DialogActions sx={{ p: 2 }}>
                            <Button onClick={() => setDetailsDialog(false)} sx={{ fontWeight: 700, textTransform: 'none' }}>Đóng</Button>
                        </DialogActions>
                    </Dialog>
                </Box>
            )}

            {/* Tab 1: Model Retrain */}
            {activeTab === 0 && (
                <Box sx={{ animation: 'fadeIn 0.5s ease-in-out' }}>
                    {/* Training Stats Grid */}
                    <Grid container spacing={0} sx={{ mb: 4, gap: 2 }}>
                        {[
                            { label: 'Tổng số mẫu', value: stats?.totalReviews || 0, color: '#2563eb', icon: <AssessmentOutlined /> },
                            { label: 'Đã huấn luyện', value: stats?.usedForTraining || 0, color: '#10b981', icon: <CheckCircleOutlined /> },
                            { label: 'Chờ huấn luyện', value: stats?.unusedForTraining || 0, color: '#f59e0b', icon: <WarningOutlined /> },
                            { label: 'Viêm phổi / Bình thường', value: `${stats?.pneumoniaCount || 0} / ${stats?.normalCount || 0}`, color: '#ef4444', icon: <RateReviewOutlined /> }
                        ].map((item, index) => (
                            <Grid item xs={12} sm={6} md={3} key={index} sx={{ flex: '1 1 auto' }}>
                                <Card sx={{ borderRadius: 3, height: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                                    <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Box>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 1 }}>
                                                {item.label}
                                            </Typography>
                                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>
                                                {item.value}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${item.color}15`, color: item.color, display: 'flex' }}>
                                            {item.icon}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Training Progress & Actions Container */}
                    <Grid container spacing={0} sx={{ mb: 4, alignItems: 'stretch', gap: 2 }}>
                        {/* Progress Card */}
                        <Grid item xs={12} md={6} sx={{ flex: '1 1 auto' }}>
                            <Card sx={{ borderRadius: 3, height: '100%', boxShadow: 2 }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>📈 Mức sẵn sàng dữ liệu huấn luyện</Typography>
                                        <Chip
                                            label={`${Math.round(getProgressPercentage())}% Sẵn sàng`}
                                            color="primary"
                                            sx={{ fontWeight: 700 }}
                                        />
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={getProgressPercentage()}
                                        sx={{
                                            height: 16,
                                            borderRadius: 5,
                                            bgcolor: '#f0f0f0',
                                            '& .MuiLinearProgress-bar': {
                                                borderRadius: 5,
                                                background: 'linear-gradient(90deg, #1976d2 0%, #43a047 100%)',
                                            }
                                        }}
                                    />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>{stats?.usedForTraining}</strong> mẫu đã huấn luyện
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>{stats?.unusedForTraining}</strong> mẫu mới chờ nạp
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Quick Actions Card */}
                        <Grid item xs={12} md={6} sx={{ flex: '1 1 auto' }}>
                            <Card sx={{ borderRadius: 3, height: '100%', boxShadow: 2, position: 'relative', overflow: 'hidden' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>🔄 Tác vụ huấn luyện lại</Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            size="large"
                                            startIcon={retraining ? <CircularProgress size={20} color="inherit" /> : <CloudUploadOutlined />}
                                            onClick={() => openRetrainDialog('unused')}
                                            disabled={retraining || (stats?.unusedForTraining || 0) === 0}
                                            sx={{ borderRadius: 2, py: 1.5, fontWeight: 700 }}
                                        >
                                            {retraining ? 'Đang xử lý...' : `Huấn luyện với mẫu mới (${stats?.unusedForTraining})`}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            size="large"
                                            onClick={() => openRetrainDialog('all')}
                                            disabled={retraining || (stats?.totalReviews || 0) === 0}
                                            sx={{ borderRadius: 2, py: 1.5, fontWeight: 700 }}
                                        >
                                            Huấn luyện lại toàn bộ mẫu ({stats?.totalReviews})
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* 5. Pending Reviews Table */}
                    {unusedReviews.length > 0 && (
                        <Card sx={{ borderRadius: 3, mb: 4, overflow: 'hidden', boxShadow: 2 }}>
                            <Box sx={{ p: 2.5, bgcolor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    📋 Danh sách dữ liệu chờ nạp (Tối đa 8 mẫu gần nhất)
                                </Typography>
                            </Box>
                            <TableContainer>
                                <Table size="medium">
                                    <TableHead>
                                        <TableRow sx={{ '& th': { fontWeight: 700, color: 'text.secondary' } }}>
                                            <TableCell>#</TableCell>
                                            <TableCell>Kết luận cuối</TableCell>
                                            <TableCell>Ghi chú bác sĩ</TableCell>
                                            <TableCell align="right">Ngày review</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paginatedPendingReviews.map((review, idx) => (
                                            <TableRow key={review.id} hover>
                                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{pendingPage * pendingRowsPerPage + idx + 1}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={review.finalLabel=== 'Pneumonia' ? 'Viêm phổi' : 'Bình thường'}
                                                        color={review.finalLabel === 'Pneumonia' ? 'error' : 'success'}
                                                        size="small"
                                                        sx={{ fontWeight: 600, borderRadius: 1 }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ color: 'text.secondary', maxWidth: { xs: 180, sm: 240, md: 300 }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {review.doctorComment || '—'}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {new Date(review.reviewedAt).toLocaleDateString('vi-VN')}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                component="div"
                                count={unusedReviews.length}
                                page={pendingPage}
                                onPageChange={(event, newPage) => setPendingPage(newPage)}
                                rowsPerPage={pendingRowsPerPage}
                                onRowsPerPageChange={(event) => {
                                    setPendingRowsPerPage(parseInt(event.target.value, 10));
                                    setPendingPage(0);
                                }}
                                rowsPerPageOptions={[5, 8, 20]}
                                labelRowsPerPage="Số dòng"
                            />
                        </Card>
                    )}

                    {/* 6. Retrain History */}
                    <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 2 }}>
                        <Box sx={{ p: 2.5, bgcolor: '#f8f9fa', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <HistoryEduOutlined color="action" />
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Lịch sử huấn luyện lại</Typography>
                        </Box>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ '& th': { fontWeight: 700 } }}>
                                        <TableCell>Thời gian</TableCell>
                                        <TableCell>Loại</TableCell>
                                        <TableCell>Mẫu nạp</TableCell>
                                        <TableCell align="right">Trạng thái</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedRetrainHistory.map((history) => (
                                        <TableRow key={history.id} hover>
                                            <TableCell>{history.date} <Typography variant="caption" color="text.secondary">{history.time}</Typography></TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={history.type === 'unused' ? 'Một phần' : 'Toàn bộ'}
                                                    size="small"
                                                    variant="outlined"
                                                    color={history.type === 'unused' ? 'primary' : 'success'}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>{history.samples}</TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>● Hoàn tất</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            component="div"
                            count={retrainHistory.length}
                            page={historyPage}
                            onPageChange={(event, newPage) => setHistoryPage(newPage)}
                            rowsPerPage={historyRowsPerPage}
                            onRowsPerPageChange={(event) => {
                                setHistoryRowsPerPage(parseInt(event.target.value, 10));
                                setHistoryPage(0);
                            }}
                            rowsPerPageOptions={[5, 10, 25]}
                            labelRowsPerPage="Số dòng"
                        />
                    </Card>

                    {/* 7. Confirmation Dialog */}
                    <Dialog
                        open={openDialog}
                        onClose={() => setOpenDialog(false)}
                        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
                    >
                        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.5rem' }}>
                            Xác nhận huấn luyện lại
                        </DialogTitle>
                        <DialogContent>
                            <Typography sx={{ mb: 2 }}>
                                Hệ thống sẽ sử dụng <strong>{retrainType === 'unused' ? stats?.unusedForTraining : stats?.totalReviews}</strong> mẫu dữ liệu để tối ưu hóa mô hình.
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#475569', mt: 1 }}>
                                Quá trình này có thể mất vài phút. Vui lòng không đóng trình duyệt.
                            </Typography>
                        </DialogContent>
                        <DialogActions sx={{ p: 2, gap: 1 }}>
                            <Button onClick={() => setOpenDialog(false)} color="inherit" sx={{ fontWeight: 600 }}>Hủy bỏ</Button>
                            <Button
                                onClick={() => handleRetrain(retrainType)}
                                variant="contained"
                                autoFocus
                                sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
                            >
                                Bắt đầu ngay
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Box>
            )}

            {/* Tab 2: User Management */}
            {activeTab === 1 && <UserManagement />}

            {/* Tab 3: Diagnosis Statistics */}

            {/* Tab 3: Quản lý người dùng (Ví dụ bổ sung để hoàn thiện Dashboard) */}
            {activeTab === 3 && (
                <Box>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32', mb: 0.25 }}>
                            👥 Quản lý người dùng
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Phân quyền và quản lý tài khoản bác sĩ/kỹ thuật viên
                        </Typography>
                    </Box>

                    <Card>
                        <CardContent sx={{ p: 1.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <TextField
                                    size="small"
                                    placeholder="Tìm kiếm bác sĩ..."
                                    sx={{ width: { xs: '100%', sm: 300 } }}
                                />
                                <Button
                                    variant="contained"
                                    startIcon={<PersonAddIcon />}
                                    sx={{ backgroundColor: '#2e7d32' }}
                                >
                                    Thêm tài khoản
                                </Button>
                            </Box>

                            <TableContainer component={Paper}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><strong>Tên bác sĩ</strong></TableCell>
                                            <TableCell><strong>Chuyên khoa</strong></TableCell>
                                            <TableCell><strong>Số lượt chẩn đoán</strong></TableCell>
                                            <TableCell><strong>Trạng thái</strong></TableCell>
                                            <TableCell align="right"><strong>Thao tác</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {/* Map dữ liệu doctors của bạn ở đây */}
                                        <TableRow hover>
                                            <TableCell>BS. Nguyễn Văn A</TableCell>
                                            <TableCell>Chẩn đoán hình ảnh</TableCell>
                                            <TableCell>145</TableCell>
                                            <TableCell>
                                                <Chip label="Đang hoạt động" color="success" size="small" />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button size="small">Sửa</Button>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Box>
            )}
        </Box> // Kết thúc Container chính của Dashboard
    );
};

export default AdminDashboardAdvanced;

