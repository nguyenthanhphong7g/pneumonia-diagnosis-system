import { useMemo, useState } from 'react';
import { Box, Chip, Paper, Tab, Tabs, Typography } from '@mui/material';

function DiagnosisMediaViewer({
    originalSrc,
    gradcamSrc,
    originalLabel = 'Ảnh gốc',
    gradcamLabel = 'GradCAM',
    height = 360,
}) {
    const hasGradcam = Boolean(gradcamSrc);
    const [viewMode, setViewMode] = useState(0);

    const activeSrc = useMemo(() => {
        if (hasGradcam && viewMode === 1) return gradcamSrc;
        return originalSrc;
    }, [hasGradcam, gradcamSrc, originalSrc, viewMode]);

    const activeLabel = hasGradcam && viewMode === 1 ? gradcamLabel : originalLabel;

    return (
        <Paper variant="outlined" sx={{ borderRadius: '16px', overflow: 'hidden', bgcolor: '#000', position: 'relative' }}>
            {hasGradcam && (
                <Box sx={{ bgcolor: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Tabs
                        value={viewMode}
                        onChange={(event, newValue) => setViewMode(newValue)}
                        variant="fullWidth"
                        textColor="inherit"
                        sx={{
                            minHeight: 44,
                            '& .MuiTabs-indicator': { backgroundColor: '#38bdf8' },
                            '& .MuiTab-root': {
                                color: '#94a3b8',
                                fontWeight: 800,
                                minHeight: 44,
                                textTransform: 'none',
                            },
                            '& .Mui-selected': {
                                color: '#fff !important',
                            },
                        }}
                    >
                        <Tab label={originalLabel} />
                        <Tab label={gradcamLabel} />
                    </Tabs>
                </Box>
            )}

            <Box sx={{ height, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#000' }}>
                {activeSrc ? (
                    <img
                        src={activeSrc}
                        alt={activeLabel}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                ) : (
                    <Typography sx={{ color: '#94a3b8', fontWeight: 600 }}>Không có dữ liệu ảnh</Typography>
                )}
            </Box>

            <Box sx={{ position: 'absolute', right: 12, bottom: 12, pointerEvents: 'none' }}>
                <Chip
                    label={activeLabel}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.85)', fontWeight: 800 }}
                />
            </Box>
        </Paper>
    );
}

export default DiagnosisMediaViewer;