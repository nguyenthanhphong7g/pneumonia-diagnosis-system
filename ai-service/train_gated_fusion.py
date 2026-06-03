"""Gated Fusion model definition used by the AI service.

This module is imported by models.fusion_api to construct the gated fusion
network when loading the saved checkpoint.
"""

import torch.nn as nn


class GatedFusion(nn.Module):

    def __init__(
        self,
        vit_dim,
        radsta_dim,
        wst_dim,
        hidden_dim=64,
        num_classes=2,
    ):
        super().__init__()

        self.vit_proj = nn.Linear(vit_dim, hidden_dim)
        self.radsta_proj = nn.Linear(radsta_dim, hidden_dim)
        self.wst_proj = nn.Linear(wst_dim, hidden_dim)

        self.norm_vit = nn.LayerNorm(hidden_dim)
        self.norm_radsta = nn.LayerNorm(hidden_dim)
        self.norm_wst = nn.LayerNorm(hidden_dim)

        self.gate_vit = nn.Linear(hidden_dim, hidden_dim)
        self.gate_radsta = nn.Linear(hidden_dim, hidden_dim)
        self.gate_wst = nn.Linear(hidden_dim, hidden_dim)

        self.sigmoid = nn.Sigmoid()
        self.dropout = nn.Dropout(0.3)
        self.classifier = nn.Linear(hidden_dim, num_classes)

    def forward(self, vit, radsta, wst, return_feature=False):
        vit = self.norm_vit(self.vit_proj(vit))
        radsta = self.norm_radsta(self.radsta_proj(radsta))
        wst = self.norm_wst(self.wst_proj(wst))

        g_vit = self.sigmoid(self.gate_vit(vit))
        g_radsta = self.sigmoid(self.gate_radsta(radsta))
        g_wst = self.sigmoid(self.gate_wst(wst))

        vit = vit * (1 + g_vit)
        radsta = radsta * (1 + g_radsta)
        wst = wst * (1 + g_wst)

        fused = (vit + radsta + wst) / 3
        fused = self.dropout(fused)

        if return_feature:
            return fused

        return self.classifier(fused)