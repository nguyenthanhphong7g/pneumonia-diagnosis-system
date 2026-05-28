import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Typography, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, Button, CircularProgress, Dialog,
    DialogTitle, DialogContent, DialogActions, Box, Chip, IconButton,
    Tooltip, alpha, Fade, Divider, TextField, InputAdornment, MenuItem,
    FormControl, Select, InputLabel, TablePagination
} from '@mui/material';
import { apiUrl } from '../config/api';
import {
    DeleteOutlined as DeleteIcon,
    VisibilityOutlined as VisibilityIcon,
    HistoryOutlined as HistoryIcon,
    CheckCircleOutlined as VerifiedIcon,
    HourglassEmptyOutlined as PendingIcon,
    ImageOutlined as ImageIcon,
    Search as SearchIcon,
    FilterAlt as FilterIcon
} from '@mui/icons-material';
import ToastNotification from '../components/ToastNotification';
import DiagnosisMediaViewer from '../components/DiagnosisMediaViewer';
import { formatModelName, resolveModelName } from '../utils/diagnosisDisplay';
import { exportHistoryDiagnosisPdf } from '../utils/diagnosisReportPdf';

function History() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRecord, setSelectedRecord] = useState(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLabel, setFilterLabel] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterModel, setFilterModel] = useState('all');
    const [filterDate, setFilterDate] = useState('');

    // Pagination states
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const exportDiagnosisReport = async (record) => {
        return exportHistoryDiagnosisPdf(record);
    };

    const fetchHistory = async () => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            setError('Bạn chưa đăng nhập. Vui lòng đăng nhập để xem lịch sử.');
            setLoading(false);
            return;
        }

        try {
            try {
                const res = await axios.get(apiUrl('/api/history-with-reviews'), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setHistory(res.data || []);
                setLoading(false);
                return;
            } catch (err) {
                console.log("Sử dụng fallback endpoint...");
            }

            const res = await axios.get(apiUrl('/api/history'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(res.data || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Không thể tải lịch sử');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const filteredHistory = history.filter(item => {
        const matchesSearch = item.id?.toString().includes(searchTerm) ||
            item.imagePath?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLabel = filterLabel === 'all' || item.label?.toLowerCase() === filterLabel.toLowerCase();
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'reviewed' && item.reviewed) ||
            (filterStatus === 'pending' && !item.reviewed);

        // Lọc theo Model
        const modelName = formatModelName(resolveModelName(item?.modelName, item?.model, item?.aiModel, item?.model_name)).toLowerCase();
        const matchesModel = filterModel === 'all' || modelName.includes(filterModel.toLowerCase());

        // Lọc theo Ngày (YYYY-MM-DD)
        const matchesDate = !filterDate || (item.createdAt && item.createdAt.startsWith(filterDate));

        return matchesSearch && matchesLabel && matchesStatus && matchesModel && matchesDate;
    });

    // Pagination logic
    const paginatedHistory = filteredHistory.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    // Handle page change
    const handlePageChange = (event, newPage) => {
        setPage(newPage);
    };

    // Handle rows per page change
    const handleRowsPerPageChange = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(0);
    }, [searchTerm, filterLabel, filterStatus, filterModel, filterDate]);

    const deleteItem = async (id) => {
        const token = sessionStorage.getItem('token');
        if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) return;
        try {
            await axios.delete(apiUrl(`/api/history/${id}`), {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(history.filter(item => item.id !== id));
        } catch (err) {
            setError('Xóa thất bại');
        }
    };

    const clearAllHistory = async () => {
        const token = sessionStorage.getItem('token');
        if (!window.confirm('CẢNH BÁO: Hành động này sẽ xóa TOÀN BỘ lịch sử. Tiếp tục?')) return;
        try {
            await axios.delete(apiUrl('/api/history/clear'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory([]);
        } catch (err) {
            setError('Xóa toàn bộ thất bại');
        }
    };

    const openDetail = (record) => setSelectedRecord(record);
    const selectedModelName = formatModelName(resolveModelName(selectedRecord?.modelName, selectedRecord?.model, selectedRecord?.aiModel, selectedRecord?.model_name));

    if (loading) return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 10, gap: 2 }}>
            <CircularProgress color="success" />
            <Typography sx={{ color: '#64748b', fontWeight: 500 }}>Đang tải hồ sơ bệnh án...</Typography>
        </Box>
    );

    return (
        <Fade in={true}>
            <Box sx={{ width: '100%', p: { xs: 2, md: 4 }, backgroundColor: '#f8fafc', minHeight: '100vh' }}>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                            <Box sx={{ bgcolor: '#10b981', p: 1, borderRadius: '12px', display: 'flex' }}>
                                <HistoryIcon sx={{ color: '#fff' }} />
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-1px' }}>
                                Lịch sử chẩn đoán
                            </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#64748b', ml: 6 }}>
                            Quản lý và xem lại các kết quả kiểm tra X-quang của bạn
                        </Typography>
                    </Box>

                    {history.length > 0 && (
                        <Button
                            variant="text"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={clearAllHistory}
                            sx={{ fontWeight: 700, textTransform: 'none', borderRadius: '10px' }}
                        >
                            Xóa tất cả
                        </Button>
                    )}
                </Box>

                {/* FILTER BOX */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        mb: 4,
                        borderRadius: '20px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: 2,
                        alignItems: 'center',
                        bgcolor: 'background.paper'
                    }}
                >
                    <TextField
                        placeholder="Tìm theo ID hoặc tên file..."
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
                            sx: { borderRadius: '12px' }
                        }}
                    />

                    <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 180 } }}>
                        <InputLabel>Kết quả AI</InputLabel>
                        <Select
                            value={filterLabel}
                            label="Kết quả AI"
                            onChange={(e) => setFilterLabel(e.target.value)}
                            sx={{ borderRadius: '12px' }}
                        >
                            <MenuItem value="all">Tất cả kết quả</MenuItem>
                            <MenuItem value="Pneumonia">Viêm phổi</MenuItem>
                            <MenuItem value="Normal">Bình thường</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 180 } }}>
                        <InputLabel>Trạng thái</InputLabel>
                        <Select
                            value={filterStatus}
                            label="Trạng thái"
                            onChange={(e) => setFilterStatus(e.target.value)}
                            sx={{ borderRadius: '12px' }}
                        >
                            <MenuItem value="all">Mọi trạng thái</MenuItem>
                            <MenuItem value="reviewed">Bác sĩ đã duyệt</MenuItem>
                            <MenuItem value="pending">Đang chờ duyệt</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 180 } }}>
                        <InputLabel>Mô hình AI</InputLabel>
                        <Select
                            value={filterModel}
                            label="Mô hình AI"
                            onChange={(e) => setFilterModel(e.target.value)}
                            sx={{ borderRadius: '12px' }}
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
                            minWidth: { xs: '100%', md: 180 },
                            '& .MuiOutlinedInput-root': { borderRadius: '12px' }
                        }}
                        InputLabelProps={{ shrink: true }}
                    />                </Paper>

                <ToastNotification
                    open={Boolean(error)}
                    message={error || ''}
                    severity="error"
                    onClose={() => setError(null)}
                />

                {history.length === 0 ? (
                    <Paper sx={{ p: 8, textAlign: 'center', borderRadius: '24px', border: '1px dashed #cbd5e1', bgcolor: 'transparent' }}>
                        <Box sx={{ mb: 2, opacity: 0.3 }}><HistoryIcon sx={{ fontSize: 60 }} /></Box>
                        <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>Chưa có dữ liệu lịch sử</Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>Các kết quả chẩn đoán AI sẽ xuất hiện tại đây.</Typography>
                    </Paper>
                ) : (
                    <Paper sx={{ borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                        <TableContainer sx={{ overflowX: 'auto' }}>
                            <Table>
                                <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Thời gian thực hiện</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>Hình ảnh</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>Kết quả AI</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>Model</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>Trạng thái xác minh</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', pr: 4 }}>Thao tác</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedHistory.map((item) => (
                                        <TableRow key={item.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell sx={{ color: '#1e293b', fontWeight: 500 }}>
                                                {new Date(item.createdAt).toLocaleString('vi-VN')}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{
                                                    width: 60, height: 60, borderRadius: '12px', overflow: 'hidden',
                                                    mx: 'auto', border: '2px solid #f1f5f9', cursor: 'pointer'
                                                }} onClick={() => openDetail(item)}>
                                                    <img
                                                        src={apiUrl(item.imagePath)}
                                                        alt="X-ray"
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={item.label === 'Pneumonia' ? 'Viêm phổi' : 'Bình thường'}
                                                    variant="soft"
                                                    sx={{
                                                        fontWeight: 800,
                                                        fontSize: '0.75rem',
                                                        bgcolor: item.label === 'Pneumonia' ? alpha('#ef4444', 0.1) : alpha('#10b981', 0.1),
                                                        color: item.label === 'Pneumonia' ? '#ef4444' : '#10b981'
                                                    }}
                                                />
                                                <Typography variant="caption" display="block" sx={{ mt: 0.5, color: '#94a3b8', fontWeight: 600 }}>
                                                    {(item.confidence * 100).toFixed(1)}%
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={formatModelName(resolveModelName(item.modelName, item.model, item.aiModel, item.model_name))}
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{ fontWeight: 700, borderStyle: 'dashed' }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                {item.reviewed ? (
                                                    <Chip
                                                        icon={<VerifiedIcon style={{ color: '#059669', fontSize: '1rem' }} />}
                                                        label="Bác sĩ đã duyệt"
                                                        sx={{ bgcolor: '#d1fae5', color: '#065f46', fontWeight: 700, fontSize: '0.7rem' }}
                                                    />
                                                ) : (
                                                    <Chip
                                                        icon={<PendingIcon style={{ fontSize: '1rem' }} />}
                                                        label="Đang chờ duyệt"
                                                        variant="outlined"
                                                        sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.7rem', borderStyle: 'dashed' }}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell align="right" sx={{ pr: 3 }}>
                                                <Tooltip title="Xem chi tiết">
                                                    <IconButton onClick={() => openDetail(item)} sx={{ color: '#2563eb', bgcolor: alpha('#2563eb', 0.05), mr: 1 }}>
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Xuất báo cáo">
                                                    <IconButton onClick={() => exportDiagnosisReport(item)} sx={{ color: '#0f766e', bgcolor: alpha('#0f766e', 0.05), mr: 1 }}>
                                                        <ImageIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Xóa bản ghi">
                                                    <IconButton onClick={() => deleteItem(item.id)} sx={{ color: '#ef4444', bgcolor: alpha('#ef4444', 0.05) }}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            component="div"
                            count={filteredHistory.length}
                            page={page}
                            onPageChange={handlePageChange}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleRowsPerPageChange}
                            rowsPerPageOptions={[5, 10, 25]}
                            labelRowsPerPage="Số dòng"
                        />
                    </Paper>
                )}

                <Dialog
                    open={!!selectedRecord}
                    onClose={() => {
                        setSelectedRecord(null);
                    }}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
                >
                    <DialogTitle sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#1e293b', pb: 1 }}>
                        Báo cáo chẩn đoán chi tiết
                    </DialogTitle>

                    <DialogContent>
                        {selectedRecord && (
                            <Box sx={{ mt: 1 }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { md: '1fr 1fr' }, gap: 3 }}>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ImageIcon fontSize="small" /> Hình ảnh X-quang
                                        </Typography>
                                        <DiagnosisMediaViewer
                                            originalSrc={apiUrl(selectedRecord.imagePath)}
                                            gradcamSrc={selectedRecord.gradcamPath ? apiUrl(selectedRecord.gradcamPath) : null}
                                            height={400}
                                        />
                                    </Box>

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <Box sx={{ p: 2, borderRadius: '16px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                            <Typography variant="overline" sx={{ color: '#94a3b8', fontWeight: 800 }}>Kết quả AI</Typography>
                                            <Typography variant="h5" sx={{
                                                fontWeight: 900,
                                                color: selectedRecord.label === 'Pneumonia' ? '#ef4444' : '#10b981'
                                            }}>
                                                {selectedRecord.label === 'Pneumonia' ? 'VIÊM PHỔI' : 'BÌNH THƯỜNG'}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                                                Độ tin cậy: <strong>{(selectedRecord.confidence * 100).toFixed(2)}%</strong>
                                            </Typography>
                                        </Box>

                                        <Box sx={{ p: 2, borderRadius: '16px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                            <Typography variant="overline" sx={{ color: '#94a3b8', fontWeight: 800 }}>Model sử dụng</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 800, color: '#1e293b' }}>
                                                {selectedModelName}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ p: 2, borderRadius: '16px', bgcolor: selectedRecord.reviewed ? alpha('#10b981', 0.05) : '#fffbeb', border: '1px solid', borderColor: selectedRecord.reviewed ? '#10b981' : '#fef3c7' }}>
                                            <Typography variant="overline" sx={{ color: selectedRecord.reviewed ? '#059669' : '#b45309', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                {selectedRecord.reviewed ? <VerifiedIcon sx={{ fontSize: 16 }} /> : <PendingIcon sx={{ fontSize: 16 }} />}
                                                Ý kiến chuyên gia
                                            </Typography>

                                            {selectedRecord.reviewed ? (
                                                <>
                                                    <Typography variant="body1" sx={{ fontWeight: 700, mt: 1, color: '#1e293b' }}>
                                                        Kết luận: {selectedRecord.finalLabel === 'Pneumonia' ? 'Viêm phổi' : 'Bình thường'}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: '#475569' }}>
                                                        "{selectedRecord.doctorComment || 'Bác sĩ không để lại lời nhắn.'}"
                                                    </Typography>
                                                    <Divider sx={{ my: 1.5, opacity: 0.5 }} />
                                                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                                                        Bác sĩ: <strong>{selectedRecord.doctorName}</strong>
                                                    </Typography>
                                                </>
                                            ) : (
                                                <Typography variant="body2" sx={{ mt: 1, color: '#92400e' }}>
                                                    Kết quả đang chờ bác sĩ xác nhận.
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 3, display: 'flex', gap: 2 }}>
                        <Button
                            onClick={() => selectedRecord && exportDiagnosisReport(selectedRecord)}
                            variant="outlined"
                            sx={{ flex: 1, borderRadius: '10px', px: 3, borderColor: '#0f766e', color: '#0f766e', '&:hover': { borderColor: '#115e59', bgcolor: '#f0fdfa' } }}
                        >
                            Xuất báo cáo PDF
                        </Button>
                        <Button
                            onClick={() => setSelectedRecord(null)}
                            variant="contained"
                            disableElevation
                            sx={{ flex: 1, borderRadius: '10px', bgcolor: '#1e293b', px: 4, '&:hover': { bgcolor: '#0f172a' } }}
                        >
                            Đóng báo cáo
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Fade>
    );
}

export default History;