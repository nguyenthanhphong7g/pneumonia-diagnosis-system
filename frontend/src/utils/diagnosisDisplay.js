export const formatModelName = (modelName) => {
    const value = (modelName || '').toString().trim();

    if (!value) return 'Unknown';

    const normalized = value.toLowerCase();
    if (normalized.includes('gated') || normalized.includes('fusion')) return 'Gated Fusion';
    if (normalized.includes('vit') && normalized.includes('logistic')) return 'ViT + LogisticRegression';
    if (normalized === 'vit') return 'ViT';
    if (normalized.includes('random') || normalized === 'rf') return 'Random Forest';
    if (normalized.includes('dense')) return 'DenseNet';

    return value;
};

export const resolveModelName = (...candidates) => {
    for (const candidate of candidates) {
        if (candidate !== undefined && candidate !== null && String(candidate).trim()) {
            return String(candidate).trim();
        }
    }

    return '';
};