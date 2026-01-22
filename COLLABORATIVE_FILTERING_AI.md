# Collaborative Filtering AI: The Neural Recommendation Engine

## Overview

This document details the implementation of the **Collaborative Filtering (CF) AI** for Soko Africa. This engine moves beyond simple visual similarity to provide personalized, user-behavior-driven recommendations, creating a true "Neural" connection between users and products.

---

## Architecture: Hybrid Recommendation System

The system uses a **Hybrid Recommendation Model** that combines two powerful techniques:

1.  **Content-Based Filtering (Visual Similarity)**: Powered by **SigLIP + Milvus** (0.4 weight). This ensures recommendations are visually relevant to the product the user is currently viewing.
2.  **Collaborative Filtering (User Behavior)**: Powered by **Matrix Factorization** (0.6 weight). This finds products that users with similar tastes have interacted with.

### **Hybrid Scoring Formula**

The final recommendation score for a product is calculated as:

$$
\text{Score} = (0.6 \times \text{CF Score}) + (0.4 \times \text{Visual Similarity Score})
$$

This weighting prioritizes **user behavior (60%)** over visual content (40%), ensuring the recommendations are highly personalized and relevant to market trends.

---

## Collaborative Filtering Implementation

### **Algorithm: Matrix Factorization (SGD)**

The engine uses **Stochastic Gradient Descent (SGD)** to train a Matrix Factorization model.

*   **User Matrix ($U$)**: Maps each user to a set of latent factors (50-dimensional embedding).
*   **Product Matrix ($P$)**: Maps each product to a set of latent factors (50-dimensional embedding).
*   **Prediction**: The predicted rating ($\hat{r}_{u,i}$) is the dot product of the user's latent factor vector ($u_u$) and the product's latent factor vector ($p_i$).

$$
\hat{r}_{u,i} = u_u^T p_i
$$

### **User Interaction Data Model**

User interactions are weighted to reflect the user's intent and commitment:

| Interaction Type | Weight | Purpose |
| :--- | :--- | :--- |
| `view` | 1.0 | Low-commitment interest |
| `click` | 2.0 | High-interest signal |
| `wishlist` | 2.5 | Strong intent signal |
| `purchase` | 3.0 | Highest commitment signal |

### **Training Details**

| Parameter | Value | Notes |
| :--- | :--- | :--- |
| **Latent Dimension** | 50 | Balances accuracy and computation speed |
| **Learning Rate** | 0.01 | Controls the step size during optimization |
| **Regularization ($\lambda$)** | 0.01 | Prevents overfitting to sparse user data |
| **Epochs** | 10 | Number of passes over the training data |

The training is designed to be run periodically by a background worker (e.g., daily) via the `/api/recommendations/train` endpoint.

---

## API Endpoints

The recommendation engine is exposed via a dedicated RESTful API router:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/recommendations/personalized/:userId` | `GET` | Serves the final hybrid recommendations for a specific user. |
| `/api/recommendations/interaction` | `POST` | Records a user action (view, click, purchase) for model training. |
| `/api/recommendations/train` | `POST` | Triggers the Matrix Factorization model training process. |
| `/api/recommendations/stats` | `GET` | Returns statistics on the model (user count, product count, RMSE). |

---

## Implementation Files

| File | Purpose |
| :--- | :--- |
| `server/services/collaborative-filtering.ts` | Core logic for the CF engine, including the Matrix Factorization algorithm and hybrid scoring. |
| `server/routes/recommendations.ts` | Express router defining all recommendation API endpoints. |
| `server/_core/index.ts` | Integration point for the new recommendations router. |

---

## Next Steps

1.  **Frontend Integration**: Integrate the `/api/recommendations/personalized/:userId` endpoint into the product detail page to display "People who viewed this also liked" recommendations.
2.  **Real-Time Interaction Tracking**: Implement a small client-side script to call the `/api/recommendations/interaction` endpoint on every product view and click.
3.  **Background Worker**: Create a dedicated worker to call the `/api/recommendations/train` endpoint daily.
