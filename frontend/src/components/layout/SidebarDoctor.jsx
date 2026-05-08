import { Link, useLocation } from 'react-router-dom';
import {
    HomeOutlined as HomeIcon,
    HistoryOutlined as HistoryIcon,
    AssignmentIndOutlined as AssignmentIcon,
    VerifiedUserOutlined as DoctorIcon,
    RateReviewOutlined as ReviewIcon
} from '@mui/icons-material';
import { Box, List, ListItemIcon, ListItemText, ListItemButton, Typography, alpha, Badge } from '@mui/material';

function SidebarDoctor() {
    const location = useLocation();

    const menuItems = [
        { path: '/', label: 'Bảng điều khiển', icon: <HomeIcon /> },
        { path: '/review', label: 'Review bệnh án', icon: <ReviewIcon />, count: 5 }, // Thêm count để tạo điểm nhấn
        { path: '/doctor-history', label: 'Lịch sử đánh giá', icon: <HistoryIcon /> },
    ];

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid rgba(226, 232, 240, 0.8)',
            }}
        >
            {/* DOCTOR IDENTIFIER SECTION */}
            <Box sx={{ p: 3, pb: 2 }}>
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 0.5, 
                    p: 2, 
                    borderRadius: '20px', 
                    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                    boxShadow: '0 8px 20px -6px rgba(37, 99, 235, 0.5)',
                    color: '#fff'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <DoctorIcon sx={{ fontSize: '1.2rem' }} />
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            Bác sĩ Chuyên khoa
                        </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 500 }}>
                        Hệ thống hỗ trợ chẩn đoán AI
                    </Typography>
                </Box>
            </Box>

            {/* Menu Section */}
            <List sx={{ flex: 1, px: 2, py: 1, overflow: 'auto' }}>
                <Typography
                    sx={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        color: '#94a3b8',
                        px: 2,
                        mb: 2,
                        mt: 1,
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                    }}
                >
                    Nghiệp vụ chuyên môn
                </Typography>

                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <ListItemButton
                            key={item.path}
                            component={Link}
                            to={item.path}
                            sx={{
                                borderRadius: '12px',
                                mb: 1,
                                px: 2,
                                py: 1.6,
                                transition: 'all 0.3s ease',
                                
                                // Màu sắc chủ đạo: Xanh Blue
                                color: isActive ? '#2563eb' : '#64748b',
                                bgcolor: isActive ? alpha('#2563eb', 0.06) : 'transparent',
                                
                                '&:hover': {
                                    bgcolor: isActive ? alpha('#2563eb', 0.1) : '#f8fafc',
                                    color: '#2563eb',
                                    transform: 'translateX(5px)',
                                },

                                // Active Indicator
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    left: 0,
                                    top: '25%',
                                    height: '50%',
                                    width: '4px',
                                    borderRadius: '0 4px 4px 0',
                                    bgcolor: '#2563eb',
                                    transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
                                    transition: 'transform 0.2s ease',
                                }
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 40,
                                    color: isActive ? '#2563eb' : '#94a3b8',
                                    transition: '0.3s',
                                }}
                            >
                                {/* Thêm Badge cho mục cần chú ý (như ca bệnh mới) */}
                                {item.count && !isActive ? (
                                    <Badge badgeContent={item.count} color="error" variant="dot">
                                        {item.icon}
                                    </Badge>
                                ) : item.icon}
                            </ListItemIcon>
                            
                            <ListItemText
                                primary={item.label}
                                primaryTypographyProps={{
                                    fontWeight: isActive ? 700 : 600,
                                    fontSize: '0.9rem',
                                }}
                            />
                        </ListItemButton>
                    );
                })}
            </List>

            {/* QUICK STATS - Một tính năng nhỏ cho bác sĩ */}
            <Box sx={{ px: 2, mb: 2 }}>
                <Box sx={{ 
                    p: 2, 
                    borderRadius: '16px', 
                    bgcolor: '#f8fafc', 
                    border: '1px solid #e2e8f0' 
                }}>
                    <Typography sx={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, mb: 1.5 }}>
                        THỐNG KÊ HÔM NAY
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>12</Typography>
                            <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600 }}>CA ĐÃ DUYỆT</Typography>
                        </Box>
                        <AssignmentIcon sx={{ color: '#cbd5e1' }} />
                    </Box>
                </Box>
            </Box>

            {/* Footer */}
            <Box sx={{ p: 3, textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>
                <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>
                    MEDICAL PORTAL v1.0.0
                </Typography>
            </Box>
        </Box>
    );
}

export default SidebarDoctor;