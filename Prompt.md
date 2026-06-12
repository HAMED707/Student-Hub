# ─────────────Prompt────────────────────────────────────────────────

    ```
    # Student Hub — Full Frontend & Backend Integration Review

## Role

You are a **Senior Full Stack Software Engineer** specializing in:

* React
* TypeScript / JavaScript
* Axios
* Django REST Framework
* Django Channels
* WebSockets
* JWT Authentication
* PostgreSQL
* Docker
* Production Deployments
* REST API Design

Your responsibility is to perform a **complete engineering review and integration** between the provided frontend and backend.

Act as if this project is about to enter production.

---

# Project Context

The project is still under active development.

Both the frontend and backend may contain:

* bugs
* missing features
* incomplete implementations
* inconsistent API designs
* integration problems

**Do not assume that either side is correct.**

Instead:

1. Inspect both projects.
2. Determine the correct implementation.
3. Modify the frontend whenever appropriate.
4. Recommend backend improvements when necessary.
5. Produce a complete engineering review.

The backend is the primary implementation, but it is **not assumed to be complete or perfect**.

---

# Available Files

You are provided with:

* Entire frontend project
* Entire backend project
* Backend overview documentation
* API URL configuration
* Project structure

Inspect the actual implementation.

Do **NOT** guess endpoint behavior.

Determine functionality by reading:

* urls.py
* views.py
* serializers.py
* models.py
* permissions.py
* pagination.py
* filters.py
* services.py
* consumers.py
* routing.py
* signals.py
* middleware.py

---

# Objectives

## 1. Analyze the Frontend

Inspect the entire frontend.

Understand:

* architecture
* routing
* authentication
* API layer
* state management
* file uploads
* websocket implementation
* environment variables
* reusable components

---

## 2. Analyze the Backend

Inspect every application.

Determine:

* endpoints
* serializers
* permissions
* request payloads
* response payloads
* status codes
* pagination
* filters
* ordering
* websocket routes
* authentication requirements
* upload endpoints

---

## 3. Perform Complete Integration

Connect the frontend with the backend.

Update the frontend to correctly use:

* API endpoints
* JWT authentication
* refresh tokens
* WebSockets
* uploads
* pagination
* filters
* search
* ordering

Reuse the existing frontend architecture.

Do not redesign the project.

---

# Verification Checklist

Inspect every API call.

Verify:

* URL paths
* HTTP methods
* serializer fields
* response parsing
* status code handling
* multipart uploads
* authentication
* permissions
* pagination
* filters
* websocket connections
* query parameters
* request headers
* content type

---

# Authentication Review

Verify:

* Login
* Register
* Logout
* JWT Obtain Pair
* JWT Refresh
* Protected Routes
* Authorization Header
* Token Storage
* Automatic Token Refresh
* Expired Access Tokens
* Refresh Token Failures
* Logout Cleanup

---

# WebSocket Review

Inspect Django Channels.

Verify:

* websocket routes
* websocket authentication
* JWT token usage
* reconnect logic
* disconnect handling
* room ids
* event names
* notification channels
* conversation channels
* payload structure

---

# Serializer Review

Compare frontend models against backend serializers.

Check:

* required fields
* optional fields
* read-only fields
* write-only fields
* nullable fields
* nested serializers
* foreign keys
* images
* files
* enums
* default values

---

# Pagination Review

Determine whether DRF pagination is enabled.

Verify support for:

* count
* next
* previous
* results

Do not assume endpoints return arrays.

---

# File Upload Review

Verify:

* multipart/form-data
* image uploads
* update uploads
* delete uploads
* preview support
* media URLs

---

# Google Maps Review

Verify:

* environment variables
* API key usage
* geocoding
* reverse geocoding
* coordinates
* distance calculations

---

# Payments Review

Inspect payment implementation.

Verify:

* payment creation
* callbacks
* webhook handling
* verification
* payment status

---

# Security Review

Inspect both frontend and backend.

Report:

* exposed secrets
* hardcoded keys
* insecure JWT storage
* missing Authorization headers
* missing permissions
* missing validation
* insecure websocket authentication
* CSRF assumptions
* XSS risks
* SQL injection risks
* unsafe HTML rendering

---

# Performance Review

Detect:

* duplicate API calls
* unnecessary refetches
* repeated websocket connections
* N+1 API patterns
* missing caching opportunities
* slow queries
* unnecessary renders

Provide recommendations.

---

# Backend Review

The backend is not assumed to be complete.

Inspect every application for:

* missing endpoints
* missing CRUD operations
* incomplete business logic
* inconsistent REST design
* inconsistent serializers
* inconsistent response formats
* duplicate endpoints
* missing validation
* missing permissions
* missing pagination
* missing filtering
* missing search
* missing websocket events
* inconsistent naming
* poor architecture
* scalability concerns

Do **NOT** automatically modify backend code.

Instead:

Document every issue.

Recommend the required backend improvement.

---

# Integration Rules

* Never invent endpoints.
* Never assume serializer fields.
* Never fake API responses.
* Never change backend endpoints unless explicitly requested.
* Prefer updating the frontend when the backend already provides the required functionality.
* If functionality is missing from the backend, document it as a backend issue.
* Preserve the existing frontend architecture.
* Follow the project's coding style.

---

# Debug Reports

Create a directory:

```text
Student-Hub/debug/
```

Generate one report per application.

Examples:

```text
debug-auth.md
debug-properties.md
debug-bookings.md
debug-favorites.md
debug-reviews.md
debug-roommates.md
debug-community.md
debug-messaging.md
debug-notifications.md
debug-payments.md
debug-services.md
```

Each report must include:

---

## Summary

Overall integration status.

---

## Frontend Issues

For every issue include:

* Issue
* Location
* Cause
* Backend Reference
* Recommended Frontend Fix
* Severity

Severity:

* Critical
* Warning
* Info

---

## Backend Issues

For every backend issue include:

* Issue
* Location
* Cause
* Impact
* Recommended Backend Fix
* Severity

Do **NOT** modify backend code.

Only recommend changes.

---

## Integration Issues

Include issues affecting communication between frontend and backend.

Examples:

* endpoint mismatch
* serializer mismatch
* JWT mismatch
* websocket mismatch
* pagination mismatch
* upload mismatch
* permission mismatch
* missing endpoint
* incorrect response format

Include:

* Cause
* Frontend Impact
* Backend Impact
* Recommended Solution

---

## API Coverage

Create a table.

| Endpoint | Method | Frontend Status | Backend Status | Result |

Result values:

* ✅ Working
* ⚠ Partial
* ❌ Broken
* 🚧 Missing Backend
* 🚧 Missing Frontend

---

## Production Risks

List anything preventing deployment.

Examples:

* missing validation
* missing authentication
* missing permissions
* missing rate limiting
* missing pagination
* missing logging
* missing environment variables
* hardcoded secrets
* missing websocket authentication

---

## Recommendations

Separate recommendations into:

### High Priority

Required before deployment.

### Medium Priority

Recommended before production.

### Low Priority

Future improvements and refactoring.

---

## Overall Status

Provide estimated percentages.

Example:

* Frontend Integration: 94%
* Backend Completeness: 90%
* Production Readiness: 84%

---

# Project Review

Generate:

```text
Student-Hub/debug/project-review.md
```

Include:

## Executive Summary

High-level overview of the entire project.

---

## Overall Metrics

Estimate:

* Backend Completeness
* Frontend Completeness
* API Coverage
* Integration Status
* Production Readiness

---

## Connected Endpoints

List every successfully integrated endpoint.

---

## Missing Frontend Features

Features available in backend but not implemented in frontend.

---

## Missing Backend Features

Features required by the frontend but absent from the backend.

---

## Architecture Review

Evaluate:

* REST API design
* Folder structure
* Reusability
* Scalability
* Maintainability
* Security
* Performance

Provide recommendations.

---

## Production Blockers

List all critical issues preventing deployment.

---

## Deployment Readiness

Evaluate readiness for:

* Docker
* Docker Compose
* Nginx
* Daphne
* PostgreSQL
* Redis
* HTTPS
* Environment Variables
* Logging
* Monitoring

---

## Final Checklist

Mark each item as:

* ✅ Working
* ⚠ Partial
* ❌ Broken

Authentication

Registration

Login

Logout

JWT Refresh

Protected Routes

Properties

Bookings

Favorites

Reviews

Roommates

Community

Messaging

Notifications

Payments

Services

Google Maps

Image Upload

Pagination

Filtering

Searching

Sorting

WebSockets

Environment Variables

Error Handling

Security

Performance

Docker Readiness

Production Readiness

---

# Deliverables

1. Fully integrated frontend.
2. Updated API service layer.
3. Updated WebSocket implementation.
4. Updated JWT authentication flow.
5. One debug report per application.
6. `project-review.md`
7. Complete API coverage report.
8. Backend improvement recommendations.
9. Frontend improvement recommendations.
10. Architecture review.
11. Production readiness review.
12. Final deployment checklist.

---

# Backend Base URL

```text
/api/
```

---

# API Groups

```text
/api/token/
/api/token/refresh/
/api/auth/
/api/properties/
/api/bookings/
/api/favorites/
/api/reviews/
/api/roommates/
/api/community/
/api/messaging/
/api/notifications/
/api/payments/
/api/services/
```

---

# Final Instruction

Do not stop after fixing the first issue.

The review is complete **only when every frontend module, every backend application, every endpoint, every serializer, every WebSocket route, and every integration path has been inspected, verified, and documented.**

Treat this as the final engineering review before the first production deployment of Student Hub.


    ```
# ─────────────End Prompt──────────────────────────────────────────────────


# ─────────────Start App API EndPoints────────────────────────────────────────────────

    ```
    
    ```
# ─────────────End App API EndPoints──────────────────────────────────────────────────



# ─────────────Start Apps APIs────────────────────────────────────────────────
    ```
    from django.urls import include, path
    from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

    urlpatterns = [
        # JWT auth endpoints for obtaining and refreshing tokens
        path('token/'        , TokenObtainPairView.as_view() , name='token_obtain_pair'),
        path('token/refresh/', TokenRefreshView.as_view() ,    name='token_refresh'),
        
        path('auth/'         , include('api.accounts_api.urls')),
        path('properties/'   , include('api.properties_api.urls')),
        path('bookings/'     , include('api.bookings_api.urls')),
        path('favorites/'    , include('api.favorites_api.urls')),
        path('reviews/'      , include('api.reviews_api.urls')),
        path('roommates/'    , include('api.roommates_api.urls')),
        path('community/'    , include('api.community_api.urls')),
        path('messaging/'    , include('api.messaging_api.urls')),
        path('notifications/', include('api.notifications_api.urls')),
        path('payments/'     , include('api.payments_api.urls')),
        path('services/'     , include('api.services_api.urls')),
    ]
    ```
# ─────────────End Apps APIs────────────────────────────────────────────────


# ─────────────────────────────────────────────────────────────

    ```
    from django.contrib import admin
    from django.conf import settings
    from django.conf.urls.static import static
    from django.urls import include, path

    urlpatterns = [
        path('admin/', admin.site.urls),
        path('api/', include('api.urls')),
    ]

    ```
# ─────────────────────────────────────────────────────────────
