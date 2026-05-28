import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
    Box, Grid, Paper, Typography, Card, CardContent, Divider,
    CircularProgress, Chip, Button, List, ListItem, ListItemText, ListItemAvatar, Avatar,
    useTheme, LinearProgress, Stack
} from '@mui/material';
import {
    PendingActions as PendingIcon,
    History as HistoryIcon,
    AssignmentTurnedIn as CompletedIcon,
    TrendingUp as StatsIcon,
    NotificationImportant as UrgentIcon,
    Star as StarIcon,
    RecentActors as RecentIcon,
    CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { apiUrl } from '../config/api';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const DoctorHome = () => {
    const theme = useTheme();
    const { token, user } = useContext(AuthContext);
    const [stats, setStats] = useState({
        pending: 0,
        todayCompleted: 0,
        totalReviewed: 0,
        agreeRate: 0
    });
    const [recentPending, setRecentPending] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!token) return;
            try {
                const authHeaders = { Authorization: `Bearer ${token}` };

                // 1. Fetch Stats
                const statsRes = await axios.get(apiUrl('/api/review/stats-summary'), {
                    headers: authHeaders
                }).catch((e) => {
                    console.error('Stats fetching error:', e);
                    return { data: { pending: 0, todayCompleted: 0, totalReviewed: 0, agreeRate: 0 } };
                });

                // 2. Fetch Pending Cases for quick view
                const pendingRes = await axios.get(apiUrl('/api/review/pending'), {
                    headers: authHeaders
                }).catch((e) => {
                    console.error('Pending fetching error:', e);
                    return { data: [] };
                });

                const pendingData = Array.isArray(pendingRes.data?.data)
                    ? pendingRes.data.data
                    : (Array.isArray(pendingRes.data) ? pendingRes.data : []);
                setRecentPending(pendingData.slice(0, 5));

                setStats({
                    pending: pendingData.length,
                    todayCompleted: statsRes.data.todayCompleted || 0,
                    totalReviewed: statsRes.data.totalReviewed || 0,
                    agreeRate: statsRes.data.agreeRate || 0
                });
            } catch (err) {
                console.error("Dashboard error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [token]);

    const StatCard = ({ title, value, icon: Icon, color, subValue }) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{
                borderRadius: '24px',
                height: '100%',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                border: '1px solid #f1f5f9',
                overflow: 'hidden'
            }}>
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                            <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.875rem', mb: 1 }}>{title}</Typography>
                            <Typography variant="h3" sx={{ fontWeight: 800, color: '#1e293b', mb: 0.5 }}>{value}</Typography>
                            {subValue && (
                                <Typography sx={{ color: color, fontWeight: 700, fontSize: '0.75rem' }}>{subValue}</Typography>
                            )}
                        </Box>
                        <Box sx={{
                            display: 'flex',
                            p: 1.5,
                            borderRadius: '16px',
                            bgcolor: alpha(color, 0.1),
                            color: color
                        }}>
                            <Icon sx={{ fontSize: 32 }} />
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Grid>
    );

    const alpha = (hex, opacity) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <CircularProgress color="primary" />
        </Box>
    );

    return (
        <Box sx={{ pb: 5 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b', letterSpacing: '-0.5px' }}>
                        Chào Bác sĩ, <Box component="span" sx={{ color: '#2563eb' }}>{user?.username || 'Chuyên gia'}</Box>!
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b', mt: 1 }}>
                        Chào mừng bạn quay lại hệ thống chẩn đoán y khoa AI.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#fff', p: 1, px: 2, borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <CalendarIcon sx={{ color: '#64748b', fontSize: 20 }} />
                    <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>
                        {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={4}>
                {/* Stats row */}
                <StatCard
                    title="Chờ Review"
                    value={stats.pending}
                    icon={PendingIcon}
                    color="#f59e0b"
                    subValue="Cần xử lý ngay"
                />
                <StatCard
                    title="Hoàn thành hôm nay"
                    value={stats.todayCompleted}
                    icon={CompletedIcon}
                    color="#10b981"
                />
                <StatCard
                    title="Đã duyệt (Tổng)"
                    value={stats.totalReviewed}
                    icon={HistoryIcon}
                    color="#3b82f6"
                />
                <StatCard
                    title="Độ đồng thuận AI"
                    value={`${stats.agreeRate}%`}
                    icon={StatsIcon}
                    color="#8b5cf6"
                />

                {/* Main Content Area */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{
                        p: 0,
                        borderRadius: '24px',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                        border: '1px solid #f1f5f9',
                        overflow: 'hidden'
                    }}>
                        <Box sx={{ p: 3, borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <RecentIcon sx={{ color: '#2563eb' }} />
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>Ca bệnh chờ duyệt gần nhất</Typography>
                            </Box>
                            <Button component={Link} to="/review" size="small" sx={{ fontWeight: 700 }}>Xem tất cả</Button>
                        </Box>

                        <List sx={{ p: 0 }}>
                            {recentPending.length > 0 ? recentPending.map((item, index) => (
                                <React.Fragment key={item.id}>
                                    <ListItem alignItems="flex-start" sx={{ px: 3, py: 2, '&:hover': { bgcolor: '#f8fafc' } }}>
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: alpha('#2563eb', 0.1), color: '#2563eb' }}>
                                                #{index + 1}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography sx={{ fontWeight: 800, color: '#1e293b' }}>
                                                        ID ca: #{item.id.toString().slice(-6).toUpperCase()}
                                                    </Typography>
                                                    <Chip
                                                        label={item.label === 'Pneumonia' ? 'Viêm phổi' : 'Bình thường'}
                                                        size="small"
                                                        color={item.label === 'Pneumonia' ? 'error' : 'success'}
                                                        sx={{ fontWeight: 700, borderRadius: '6px' }}
                                                    />
                                                </Box>
                                            }
                                            secondary={
                                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
                                                    Độ tin cậy AI: {(item.confidence * 100).toFixed(1)}% | Ngày: {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                                                </Typography>
                                            }
                                        />
                                        <Button
                                            component={Link}
                                            to="/review"
                                            variant="outlined"
                                            size="small"
                                            sx={{ ml: 2, borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
                                        >
                                            Xử lý
                                        </Button>
                                    </ListItem>
                                    {index < recentPending.length - 1 && <Divider component="li" sx={{ mx: 3 }} />}
                                </React.Fragment>
                            )) : (
                                <Box sx={{ p: 5, textAlign: 'center' }}>
                                    <Typography color="text.secondary">Tất cả ca bệnh đã được duyệt!</Typography>
                                </Box>
                            )}
                        </List>
                    </Paper>
                </Grid>

                {/* Sidebar row */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Stack spacing={4}>
                        <Paper sx={{ p: 3, borderRadius: '24px', border: '1px solid #e2e8f0', bgcolor: '#ffffff', boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.04)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                                <UrgentIcon sx={{ color: '#ef4444' }} />
                                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>Lời nhắc quan trọng</Typography>
                            </Box>

                            <Stack spacing={2}>
                                {stats.pending > 10 && (
                                    <Box sx={{ p: 2, borderRadius: '16px', bgcolor: alpha('#ef4444', 0.05), border: '1px solid', borderColor: alpha('#ef4444', 0.1) }}>
                                        <Typography sx={{ color: '#ef4444', fontWeight: 800, fontSize: '0.85rem' }}>Hàng chờ quá tải</Typography>
                                        <Typography sx={{ color: '#ef4444', fontSize: '0.8rem', opacity: 0.8 }}>Hiện có {stats.pending} ca đang chờ phê duyệt.</Typography>
                                    </Box>
                                )}
                                <Box sx={{ p: 2, borderRadius: '16px', bgcolor: alpha('#2563eb', 0.05), border: '1px solid', borderColor: alpha('#2563eb', 0.1) }}>
                                    <Typography sx={{ color: '#2563eb', fontWeight: 800, fontSize: '0.85rem' }}>Hệ thống AI mới</Typography>
                                    <Typography sx={{ color: '#2563eb', fontSize: '0.8rem', opacity: 0.8 }}>Model Gated Fusion đã được nâng cấp độ chính xác lên 92%.</Typography>
                                </Box>
                                <Box sx={{ p: 2, borderRadius: '16px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                    <Typography sx={{ color: '#64748b', fontWeight: 800, fontSize: '0.85rem' }}>Báo cáo tuần</Typography>
                                    <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>Bạn đã duyệt tổng cộng {stats.totalReviewed} ca bệnh.</Typography>
                                </Box>
                            </Stack>
                        </Paper>

                        <Paper sx={{
                            p: 3,
                            borderRadius: '24px',
                            background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
                            border: '1px solid #dbeafe',
                            color: '#0f172a',
                            boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.04)'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                <StarIcon sx={{ color: '#2563eb' }} />
                                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>Mẹo chẩn đoán AI</Typography>
                            </Box>
                            <Typography sx={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
                                Khi xem bản đồ Heatmap (Grad-CAM), hãy chú ý đến các vùng có màu đỏ đậm - đó là nơi AI tập trung để đưa ra quyết định chẩn đoán.
                            </Typography>
                        </Paper>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DoctorHome;
