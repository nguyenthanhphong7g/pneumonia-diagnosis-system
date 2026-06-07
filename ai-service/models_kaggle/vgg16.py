import os
import cv2
import random
import numpy as np
import matplotlib.pyplot as plt
import keras
import tensorflow as tf
import seaborn as sns
from sklearn.metrics import confusion_matrix

from sklearn.model_selection import GridSearchCV
from sklearn.ensemble import RandomForestClassifier

from keras.applications import DenseNet169
from keras.applications import VGG16
from tensorflow.keras.applications import ResNet50

from sklearn.neighbors import KNeighborsClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier



def metrics(y_true, y_pred):
    print(np.sum((y_true == 0) & (y_pred == 0)))
    print(np.sum((y_true == 0) & (y_pred == 1)))
    print(np.sum((y_true == 1) & (y_pred == 0)))
    print(np.sum((y_true == 1) & (y_pred == 1)))
    

from sklearn.metrics import accuracy_score

from sklearn.metrics import precision_score

def fdr(y_true, y_pred):
    FP = np.sum((y_true == 0) & (y_pred == 1))
    TP = np.sum((y_true == 1) & (y_pred == 1))
    
    fdr_ = FP / (FP + TP) if (FP + TP) > 0 else 0
    
    return fdr_

from sklearn.metrics import recall_score

def fnr(y_true, y_pred):
    FN = np.sum((y_true == 1) & (y_pred == 0))
    TP = np.sum((y_true == 1) & (y_pred == 1))
    
    fnr_ = FN / (FN + TP) if (FN + TP) > 0 else 0
    
    return fnr_

def specificity(y_true, y_pred):
    TN = np.sum((y_true == 0) & (y_pred == 0))
    FP = np.sum((y_true == 0) & (y_pred == 1))
    
    specificity_ = TN / (TN + FP) if (TN + FP) > 0 else 0
    
    return specificity_

def npv(y_true, y_pred):
    TN = np.sum((y_true == 0) & (y_pred == 0))
    FN = np.sum((y_true == 1) & (y_pred == 0))
    
    npv_ = TN / (TN + FN) if (TN + FN) > 0 else 0
    
    return npv_

from sklearn.metrics import f1_score

from sklearn.metrics import balanced_accuracy_score

from sklearn.metrics import roc_auc_score

from sklearn.metrics import matthews_corrcoef

def evaluate_model(y_true, y_pred, name="Model"):
    print(f"\n{name}")
    print('accuracy = {}'.format(accuracy_score(y_test, y_pred)))
    print('precision = {}'.format(precision_score(y_test, y_pred)))
    print('FDR = {}'.format(fdr(y_test, y_pred)))
    print('recall = {}'.format(recall_score(y_test, y_pred)))
    print('FNR = {}'.format(fnr(y_test, y_pred)))
    print('specificity = {}'.format(specificity(y_test, y_pred)))
    print('NPV = {}'.format(npv(y_test, y_pred)))
    print('f1-score = {}'.format(f1_score(y_test, y_pred)))
    print('BAcc = {}'.format(balanced_accuracy_score(y_test, y_pred)))
    print('AUC = {}'.format(roc_auc_score(y_test, y_pred)))
    print('MCC = {}'.format(matthews_corrcoef(y_test, y_pred)))

img_size = 128

x_train_cxr = np.load('/kaggle/input/pneumonia-detection-datasets/chest-xray/train/images.npy')
y_train = np.load('/kaggle/input/pneumonia-detection-datasets/chest-xray/train/labels.npy')

x_test_cxr = np.load('/kaggle/input/pneumonia-detection-datasets/chest-xray/test/images.npy')
y_test = np.load('/kaggle/input/pneumonia-detection-datasets/chest-xray/test/labels.npy')

print(np.shape(x_train_cxr))
print(np.shape(y_train))
print(np.shape(x_test_cxr))
print(np.shape(y_test))

x_train_cxr = x_train_cxr.reshape(-1, img_size, img_size)
x_train_rgb_cxr = np.stack((x_train_cxr,) * 3, axis=-1)

x_test_cxr = x_test_cxr.reshape(-1, img_size, img_size)
x_test_rgb_cxr = np.stack((x_test_cxr,) * 3, axis=-1)

print(np.shape(x_train_rgb_cxr))
print(np.shape(y_train))
print(np.shape(x_test_rgb_cxr))
print(np.shape(y_test))

idx = 0
plt.imshow(x_train_rgb_cxr[0], cmap='gray')
plt.show()

fe_model = VGG16(weights= 'imagenet', include_top=False, input_shape=(128, 128, 3))
fe_model.summary()

x_train_feature_cxr = fe_model.predict(x_train_rgb_cxr, verbose=True).reshape(np.shape(y_train)[0], -1)
x_test_feature_cxr = fe_model.predict(x_test_rgb_cxr, verbose=True).reshape(np.shape(y_test)[0], -1)

print(np.shape(x_train_feature_cxr))
print(np.shape(x_test_feature_cxr))

# from collections import Counter
# n_samples = len(y_train)

# # Đếm số lượng mẫu trong từng lớp
# class_counts = Counter(y_train)  # Tạo dictionary {0: số lượng, 1: số lượng}
# n_classes = len(class_counts)  # Số lớp (ở đây là 2: 0 và 1)

# # Tính trọng số cho từng lớp
# class_weights = {cls: n_samples / (n_classes * count) for cls, count in class_counts.items()}

# # In kết quả
# print("Số lượng mẫu mỗi lớp:", class_counts)
# print("Trọng số tính toán:", class_weights)

# print(y_train.shape)
# print("Images for Train", np.shape(x_train_feature_cxr))

# print(y_test.shape)
# param_grid = {
#     'n_estimators': [100, 150, 200],
#     'max_depth': [10, 15, None],  
#     'criterion': ['entropy', 'gini'],
#     'min_samples_split': [2, 10],
#     'min_samples_leaf' : [1, 2],
# }

# grid_search = GridSearchCV(
#     estimator=RandomForestClassifier(random_state=42, class_weight = class_weights), 
#     param_grid=param_grid, 
#     cv=5, 
#     scoring='accuracy', 
#     verbose=4
# )

# grid_search.fit(x_train_feature_cxr, y_train)

# print("Best Parameters:", grid_search.best_params_)

# param_grid_knn = {
#     'n_neighbors': [3, 5, 7, 9],
#     'weights': ['uniform', 'distance'],
#     'metric': ['euclidean', 'manhattan']
# }

# grid_knn = GridSearchCV(
#     KNeighborsClassifier(),
#     param_grid_knn,
#     cv=5,
#     scoring='balanced_accuracy',
#     n_jobs=-1,
#     verbose=2
# )

# grid_knn.fit(x_train_feature_cxr, y_train)
# print("Best KNN params:", grid_knn.best_params_)

param_grid_lr = {
    'C': [0.01, 0.1, 1, 10],
    'penalty': ['l2'],
    'solver': ['lbfgs'],
}

grid_lr = GridSearchCV(
    LogisticRegression(
        max_iter=1000,
        class_weight='balanced'
    ),
    param_grid_lr,
    cv=5,
    scoring='balanced_accuracy',
    n_jobs=-1,
    verbose=2
)

grid_lr.fit(x_train_feature_cxr, y_train)
print("Best LR params:", grid_lr.best_params_)


# param_grid_svm_linear = {
#     'C': [0.01, 0.1, 1, 10]
# }

# grid_svm_linear = GridSearchCV(
#     SVC(
#         kernel='linear',
#         class_weight='balanced'
#     ),
#     param_grid_svm_linear,
#     cv=5,
#     scoring='balanced_accuracy',
#     n_jobs=-1,
#     verbose=2
# )

# grid_svm_linear.fit(x_train_feature_cxr, y_train)
# print("Best Linear SVM params:", grid_svm_linear.best_params_)


# param_grid_svm_rbf = {
#     'C': [0.1, 1, 10],
#     'gamma': ['scale', 0.01, 0.001]
# }

# grid_svm_rbf = GridSearchCV(
#     SVC(
#         kernel='rbf',
#         class_weight='balanced'
#     ),
#     param_grid_svm_rbf,
#     cv=5,
#     scoring='balanced_accuracy',
#     n_jobs=-1,
#     verbose=2
# )

# grid_svm_rbf.fit(x_train_feature_cxr, y_train)
# print("Best RBF-SVM params:", grid_svm_rbf.best_params_)


# from sklearn.neural_network import MLPClassifier
# from sklearn.model_selection import GridSearchCV

# param_grid_mlp = {
#     'hidden_layer_sizes': [(32,), (64,), (128,), (64, 32), (128, 64)],
#     'activation': ['relu', 'tanh'],
#     'solver': ['adam'],
#     'alpha': [1e-5, 1e-4, 1e-3],
#     'learning_rate_init': [0.001, 0.01],
#     'learning_rate': ['constant', 'adaptive'],
#     'max_iter': [500],
#     'early_stopping': [True]
# }
# grid_mlp = GridSearchCV(
#     MLPClassifier(random_state=42),
#     param_grid_mlp,
#     cv=5,
#     scoring='balanced_accuracy',
#     n_jobs=1,
#     verbose=4
# )

# grid_mlp.fit(x_train_feature_cxr, y_train)

# print("Best MLP params:", grid_mlp.best_params_)

models = {
    # "KNN": grid_knn.best_estimator_,
    "Logistic Regression": grid_lr.best_estimator_,
    # "Linear SVM": grid_svm_linear.best_estimator_,
    # "RBF-SVM": grid_svm_rbf.best_estimator_,
    # "MLP": grid_mlp.best_estimator_,
    # "Random Forest": grid_search.best_estimator_
}

for name, model in models.items():
    y_pred = model.predict(x_test_feature_cxr)
    evaluate_model(y_test, y_pred, name)


import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix

for name, model in models.items():
    y_pred = model.predict(x_test_feature_cxr)
    
    cm = confusion_matrix(y_test, y_pred)
    
    plt.figure(figsize=(5, 4))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
    
    plt.title(f'Confusion Matrix - {name}')
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    
    plt.show()