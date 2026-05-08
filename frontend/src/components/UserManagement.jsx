import React, { useState, useEffect } from 'react';
import {
    Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Select, MenuItem, FormControl,
    InputLabel, Alert, CircularProgress, Chip, IconButton, Grid, Divider,
    InputAdornment, Stack, TablePagination
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    PersonAdd as PersonAddIcon,
    RefreshOutlined,
    LockOutlined,
    LockOpenOutlined,
    Search as SearchIcon,
    AdminPanelSettings,
    MedicalServices,
    AccessibleForward,
    Group
} from '@mui/icons-material';
import axios from 'axios';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState('add');
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '', email: '', password: '', role: 'PATIENT',
    });
    const [stats, setStats] = useState(null);
    const [usersPage, setUsersPage] = useState(0);
    const [usersRowsPerPage, setUsersRowsPerPage] = useState(10);

    const API_BASE = 'http://localhost:8080/api/admin/users';

    useEffect(() => {
        fetchUsers();
        fetchStats();
    }, []);

    useEffect(() => {
        setUsersPage(0);
    }, [searchTerm]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get(API_BASE);
            setUsers(response.data || []);
            setMessage(null);
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Lỗi tải danh sách người dùng';
            setMessage({ type: 'error', text: `❌ ${errorMsg}` });
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_BASE}/stats/by-role`);
            setStats(response.data);
        } catch (error) { }
    };

    // Filter users locally for better UX
    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const paginatedUsers = filteredUsers.slice(
        usersPage * usersRowsPerPage,
        usersPage * usersRowsPerPage + usersRowsPerPage
    );

    const handleOpenDialog = (mode, user = null) => {
        setDialogMode(mode);
        if (mode === 'add') {
            setFormData({ username: '', email: '', password: '', role: 'PATIENT' });
        } else {
            setSelectedUser(user);
            setFormData({
                username: user.username,
                email: user.email || '',
                password: '',
                role: user.role || 'PATIENT',
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedUser(null);
    };

    const handleFormChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveUser = async () => {
        try {
            if (!formData.username.trim()) {
                setMessage({ type: 'error', text: 'Username không được để trống' });
                return;
            }
            if (dialogMode === 'add') {
                await axios.post(API_BASE, formData);
                setMessage({ type: 'success', text: 'Tạo người dùng thành công' });
            } else {
                await axios.put(`${API_BASE}/${selectedUser.id}`, formData);
                setMessage({ type: 'success', text: 'Cập nhật thành công' });
            }
            handleCloseDialog();
            fetchUsers();
            fetchStats();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Lỗi khi lưu' });
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Bạn chắc chắn muốn xóa người dùng này?')) {
            try {
                await axios.delete(`${API_BASE}/${userId}`);
                setMessage({ type: 'success', text: 'Đã xóa người dùng' });
                fetchUsers();
                fetchStats();
            } catch (error) {
                setMessage({ type: 'error', text: 'Lỗi khi xóa người dùng' });
            }
        }
    };

    const handleLockToggle = async (user) => {
        const isLocking = user.status !== 'LOCKED';
        try {
            if (isLocking) {
                const reason = window.prompt('Lý do khóa:', 'Vi phạm điều khoản');
                if (reason) await axios.put(`${API_BASE}/${user.id}/lock`, { reason });
            } else {
                await axios.put(`${API_BASE}/${user.id}/unlock`);
            }
            fetchUsers();
            setMessage({ type: 'success', text: isLocking ? 'Đã khóa tài khoản' : 'Đã mở khóa' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Thao tác thất bại' });
        }
    };

    const renderStatCard = (title, count, icon, color) => (
        <Card sx={{
            borderRadius: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: '1px solid',
            borderColor: `${color}.100`,
            background: `linear-gradient(135deg, #fff 60%, ${color}.50 100%)`
        }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                        {title}
                    </Typography>
                    <Typography variant="h4" fontWeight={800} color={`${color}.main`}>
                        {count || 0}
                    </Typography>
                </Box>
                <Box sx={{
                    backgroundColor: `${color}.100`,
                    p: 1.5,
                    borderRadius: 3,
                    display: 'flex',
                    color: `${color}.main`
                }}>
                    {icon}
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
            {/* Header Area */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4, justifyContent: { xs: 'flex-start', sm: 'space-between' }, alignItems: { sm: 'center' } }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} sx={{ color: '#1e293b', letterSpacing: '-0.02em' }}>
                        Quản lý người dùng
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Hệ thống điều hành tài khoản và phân quyền
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1.5}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshOutlined />}
                        onClick={fetchUsers}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                        Làm mới
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<PersonAddIcon />}
                        onClick={() => handleOpenDialog('add')}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}
                    >
                        Thêm mới
                    </Button>
                </Stack>
            </Stack>

            {/* Notification */}
            {message && (
                <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 3, borderRadius: 2 }}>
                    {message.text}
                </Alert>
            )}

            {/* Statistics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    {renderStatCard('TỔNG SỐ', stats?.total, <Group />, 'primary')}
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    {renderStatCard('QUẢN TRỊ', stats?.admin, <AdminPanelSettings />, 'error')}
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    {renderStatCard('BÁC SĨ', stats?.doctor, <MedicalServices />, 'info')}
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    {renderStatCard('BỆNH NHÂN', stats?.patient, <AccessibleForward />, 'success')}
                </Grid>
            </Grid>

            {/* Main Content Area */}
            <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                {/* Table ToolBar */}
                <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                    <TextField
                        size="small"
                        placeholder="Tìm theo tên, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'text.secondary' }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: { xs: '100%', sm: 300 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>NGƯỜI DÙNG</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>VAI TRÒ</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>TRẠNG THÁI</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, color: '#64748b' }}>THAO TÁC</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5 }}><CircularProgress size={30} /></TableCell></TableRow>
                            ) : filteredUsers.length === 0 ? (
                                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5, color: 'text.secondary' }}>Không tìm thấy dữ liệu</TableCell></TableRow>
                            ) : (
                                paginatedUsers.map((user) => (
                                    <TableRow key={user.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                <Typography variant="body2" fontWeight={700} color="#1e293b">{user.username}</Typography>
                                                <Typography variant="caption" color="text.secondary">{user.email || 'Chưa cập nhật email'}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.role}
                                                size="small"
                                                sx={{
                                                    fontWeight: 600,
                                                    fontSize: '0.7rem',
                                                    backgroundColor: user.role === 'ADMIN' ? '#fee2e2' : user.role === 'DOCTOR' ? '#e0e7ff' : '#dcfce7',
                                                    color: user.role === 'ADMIN' ? '#991b1b' : user.role === 'DOCTOR' ? '#3730a3' : '#166534'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: user.status === 'LOCKED' ? 'error.main' : 'success.main' }} />
                                                <Typography variant="body2" sx={{ color: user.status === 'LOCKED' ? 'error.main' : 'success.main', fontWeight: 500 }}>
                                                    {user.status === 'LOCKED' ? 'Bị khóa' : 'Hoạt động'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
                                                <IconButton size="small" onClick={() => handleOpenDialog('edit', user)} sx={{ color: 'primary.main', bgcolor: 'primary.50', '&:hover': { bgcolor: 'primary.100' } }}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => handleLockToggle(user)} sx={{ color: 'warning.main', bgcolor: 'warning.50', '&:hover': { bgcolor: 'warning.100' } }}>
                                                    {user.status === 'LOCKED' ? <LockOpenOutlined fontSize="small" /> : <LockOutlined fontSize="small" />}
                                                </IconButton>
                                                <IconButton size="small" onClick={() => handleDeleteUser(user.id)} sx={{ color: 'error.main', bgcolor: 'error.50', '&:hover': { bgcolor: 'error.100' } }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={filteredUsers.length}
                    page={usersPage}
                    onPageChange={(event, newPage) => setUsersPage(newPage)}
                    rowsPerPage={usersRowsPerPage}
                    onRowsPerPageChange={(event) => {
                        setUsersRowsPerPage(parseInt(event.target.value, 10));
                        setUsersPage(0);
                    }}
                    rowsPerPageOptions={[5, 10, 25]}
                    labelRowsPerPage="Số dòng"
                />
            </Paper>

            {/* Add/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 800, px: 3, pt: 3 }}>
                    {dialogMode === 'add' ? 'Thêm tài khoản mới' : 'Cập nhật thông tin'}
                </DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Vui lòng điền đầy đủ các thông tin định danh người dùng bên dưới.
                    </Typography>
                    <Stack spacing={2.5}>
                        <TextField
                            label="Tên đăng nhập"
                            fullWidth
                            value={formData.username}
                            onChange={(e) => handleFormChange('username', e.target.value)}
                            disabled={dialogMode === 'edit'}
                        />
                        <TextField
                            label="Email"
                            fullWidth
                            value={formData.email}
                            onChange={(e) => handleFormChange('email', e.target.value)}
                        />
                        <TextField
                            label={dialogMode === 'add' ? "Mật khẩu" : "Mật khẩu mới (để trống nếu không đổi)"}
                            type="password"
                            fullWidth
                            value={formData.password}
                            onChange={(e) => handleFormChange('password', e.target.value)}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Vai trò</InputLabel>
                            <Select
                                value={formData.role}
                                label="Vai trò"
                                onChange={(e) => handleFormChange('role', e.target.value)}
                            >
                                <MenuItem value="ADMIN">Quản trị viên</MenuItem>
                                <MenuItem value="DOCTOR">Bác sĩ</MenuItem>
                                <MenuItem value="PATIENT">Bệnh nhân</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleCloseDialog} color="inherit" sx={{ fontWeight: 600 }}>Hủy</Button>
                    <Button onClick={handleSaveUser} variant="contained" sx={{ px: 4, borderRadius: 2, fontWeight: 600 }}>
                        {dialogMode === 'add' ? 'Tạo ngay' : 'Lưu thay đổi'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserManagement;