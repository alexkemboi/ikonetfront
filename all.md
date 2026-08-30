{
  "openapi": "3.1.0",
  "info": {
    "title": "IBS API",
    "description": "Internet Billing System",
    "contact": {
      "name": "Backend Team -IBS",
      "url": "https://www.ikonexsystems.com",
      "email": "info@ikonexsystems.com"
    },
    "version": "v1.0.0"
  },
  "servers": [
    {
      "url": "https://api.beesmartbedak.com",
      "description": "Production Gateway"
    },
    {
      "url": "http://localhost:8381",
      "description": "Local Development"
    }
  ],
  "tags": [
    {
      "name": "Net Packages",
      "description": "Manage internet packages"
    },
    {
      "name": "IPAM & IP Mappings",
      "description": "IP Address Management, Pool utilization, and Subscriber IP mappings"
    },
    {
      "name": "Statements",
      "description": "Customer statement generation and download APIs"
    },
    {
      "name": "WireGuard",
      "description": "WireGuard VPN peer registration for MikroTik devices"
    },
    {
      "name": "Tickets",
      "description": "Support Ticket Management APIs"
    },
    {
      "name": "System Users",
      "description": "Manage system users"
    },
    {
      "name": "Customer Devices",
      "description": "v1 APIs for registering headless customer devices for MAC authentication bypass"
    },
    {
      "name": "Network Devices",
      "description": "Manage Network devices"
    },
    {
      "name": "Payment Integration",
      "description": "Trigger and manage M-Pesa payments"
    },
    {
      "name": "Three-Way Reconciliation",
      "description": "Level 3 audit: Gateway Inflows vs Commercial Orders vs Delivered Service Bytes"
    },
    {
      "name": "Finance Revenue & Transactions",
      "description": "Dashboard revenue summary and paginated ledger transaction drill-down"
    },
    {
      "name": "Hotspot",
      "description": "Hotspot internet access — packages, payments, sessions"
    },
    {
      "name": "Analytics",
      "description": "Payment and profit-and-loss analytics APIs"
    },
    {
      "name": "Expenses",
      "description": "Expense management APIs"
    },
    {
      "name": "Payment Progress Poller",
      "description": "Atomic state-progressive checkout polling for captive portals"
    }
  ],
  "paths": {
    "/api/v1/system/users/{idxno}": {
      "put": {
        "tags": [
          "System Users"
        ],
        "summary": "Update system user details",
        "operationId": "updateSystemUser",
        "parameters": [
          {
            "name": "idxno",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateSystemUserRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseSystemUserResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/system/users/{idxno}/role": {
      "put": {
        "tags": [
          "System Users"
        ],
        "summary": "Assign role to system user",
        "operationId": "assignRole",
        "parameters": [
          {
            "name": "idxno",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/AssignRoleRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseSystemUserResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/system-setup/update-role/{id}": {
      "put": {
        "tags": [
          "system-setup-controller"
        ],
        "summary": "Update Role",
        "operationId": "update",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateRoleRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseRole"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/notification-providers/{id}": {
      "get": {
        "tags": [
          "notification-provider-controller"
        ],
        "summary": "Get Provider By ID",
        "operationId": "getById",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseNotificationProviderResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      },
      "put": {
        "tags": [
          "notification-provider-controller"
        ],
        "summary": "Update Notification Provider",
        "operationId": "update_1",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/NotificationProviderRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseNotificationProviderResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      },
      "delete": {
        "tags": [
          "notification-provider-controller"
        ],
        "summary": "Delete Notification Provider",
        "operationId": "delete",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseString"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/network-devices/{id}": {
      "put": {
        "tags": [
          "Network Devices"
        ],
        "summary": "Update a network device",
        "operationId": "updateDevice",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateDeviceRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseDeviceResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/expenses/{id}": {
      "get": {
        "tags": [
          "Expenses"
        ],
        "summary": "Get an expense",
        "operationId": "getExpense",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseExpenseResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      },
      "put": {
        "tags": [
          "Expenses"
        ],
        "summary": "Update an expense",
        "operationId": "updateExpense",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ExpenseRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseExpenseResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      },
      "delete": {
        "tags": [
          "Expenses"
        ],
        "summary": "Delete an expense",
        "operationId": "deleteExpense",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseVoid"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/customers/{idxno}": {
      "get": {
        "tags": [
          "customer-controller"
        ],
        "summary": "Get customer by ID",
        "operationId": "getById_1",
        "parameters": [
          {
            "name": "idxno",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseCustomerResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      },
      "put": {
        "tags": [
          "customer-controller"
        ],
        "summary": "Update customer (details / password / package)",
        "operationId": "update_2",
        "parameters": [
          {
            "name": "idxno",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CustomerRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseCustomerResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      },
      "delete": {
        "tags": [
          "customer-controller"
        ],
        "summary": "Delete customer",
        "operationId": "delete_1",
        "parameters": [
          {
            "name": "idxno",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseVoid"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/tickets": {
      "get": {
        "tags": [
          "Tickets"
        ],
        "summary": "Retrieves all support tickets in the system",
        "operationId": "getAllTickets",
        "responses": {
          "200": {
            "description": "Tickets retrieved successfully",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListTicketResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      },
      "post": {
        "tags": [
          "Tickets"
        ],
        "summary": "Creates a new support ticket and assigns SLA based on priority",
        "operationId": "createTicket",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/TicketRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Ticket created successfully",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseTicketResponse"
                }
              }
            }
          },
          "400": {
            "description": "Invalid request data",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseTicketResponse"
                }
              }
            }
          },
          "404": {
            "description": "Customer or User not found",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseTicketResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/tickets/{id}/comments": {
      "get": {
        "tags": [
          "Tickets"
        ],
        "summary": "Retrieves all comments associated with a specific ticket",
        "operationId": "getComments",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Comments retrieved successfully",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListTicketCommentResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      },
      "post": {
        "tags": [
          "Tickets"
        ],
        "summary": "Adds a comment or internal note to a ticket",
        "operationId": "addComment",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/TicketCommentRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Comment added successfully",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseTicketCommentResponse"
                }
              }
            }
          },
          "400": {
            "description": "Ticket is closed",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseTicketCommentResponse"
                }
              }
            }
          },
          "404": {
            "description": "Ticket or Author not found",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseTicketCommentResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/system/packages": {
      "get": {
        "tags": [
          "Net Packages"
        ],
        "summary": "Get all packages",
        "operationId": "getAll",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListNetPackageResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      },
      "post": {
        "tags": [
          "Net Packages"
        ],
        "summary": "Create a new internet package",
        "operationId": "create",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/NetPackageRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseNetPackageResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/system-setup/{roleCode}/menus": {
      "get": {
        "tags": [
          "system-setup-controller"
        ],
        "summary": "Get Menus By RoleCode",
        "operationId": "getRoleMenus",
        "parameters": [
          {
            "name": "roleCode",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListRoleMenuResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      },
      "post": {
        "tags": [
          "system-setup-controller"
        ],
        "summary": "Assign Menu To RoleCode",
        "operationId": "assignPermission",
        "parameters": [
          {
            "name": "roleCode",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/RoleMenuPermissionRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseString"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/system-setup/user/register": {
      "post": {
        "tags": [
          "system-setup-controller"
        ],
        "summary": "Add System User",
        "operationId": "register",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/RegisterRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseAuthResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/system-setup/add-role": {
      "post": {
        "tags": [
          "system-setup-controller"
        ],
        "summary": "Create Role",
        "operationId": "create_1",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateRoleRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseRole"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/statements/generate": {
      "post": {
        "tags": [
          "Statements"
        ],
        "summary": "Generate a customer statement for a date range or month",
        "operationId": "generateStatement",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/StatementRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseStatementResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/radius/accounting": {
      "post": {
        "tags": [
          "radius-accounting-controller"
        ],
        "operationId": "ingest",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/HotspotAccountingRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "string"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/provision/bootstrap-tokens": {
      "post": {
        "tags": [
          "router-provisioning-controller"
        ],
        "operationId": "create_2",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/BootstrapTokenRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseBootstrapTokenResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/pppoe/subscriptions/renew": {
      "post": {
        "tags": [
          "PPPoE Subscriptions"
        ],
        "summary": "Renew PPPoE subscription",
        "operationId": "renewSubscription",
        "parameters": [
          {
            "name": "customerId",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          },
          {
            "name": "accountId",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseVoid"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/pppoe/subscriptions/activate": {
      "post": {
        "tags": [
          "PPPoE Subscriptions"
        ],
        "summary": "Activate PPPoE subscription",
        "operationId": "assignPackage",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/AssignPackageRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseVoid"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/pppoe/radius/auth": {
      "post": {
        "tags": [
          "PPPoE RADIUS"
        ],
        "summary": "Process RADIUS authentication request",
        "operationId": "radiusAuth",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/RadiusAuthRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseRadiusAuthResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/pppoe/payments/stk-push": {
      "post": {
        "tags": [
          "PPPoE Payments"
        ],
        "summary": "Initiate M-Pesa STK Push",
        "operationId": "pay",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PppoePaymentRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseVoid"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/pppoe/payments/callback": {
      "post": {
        "tags": [
          "PPPoE Payments"
        ],
        "summary": "Process M-Pesa payment callback",
        "operationId": "mpesaCallback",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/MpesaCallbackDto"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "string"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/pppoe/packages": {
      "get": {
        "tags": [
          "PPPoE Packages"
        ],
        "summary": "Get all PPPoE packages",
        "operationId": "getAllPackages",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListPppoePackageResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      },
      "post": {
        "tags": [
          "PPPoE Packages"
        ],
        "summary": "Create PPPoE package",
        "operationId": "createPackage",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PppoePackageRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponsePppoePackageResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/pppoe/accounts": {
      "post": {
        "tags": [
          "PPPoE Accounts"
        ],
        "summary": "Create PPPoE account",
        "operationId": "createAccount",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PppoeAccountRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponsePppoeAccountResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/payments/trigger": {
      "post": {
        "tags": [
          "Payment Integration"
        ],
        "summary": "Trigger M-Pesa STK Push payment for a package (no auth required)",
        "operationId": "triggerPayment",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/TriggerPaymentRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseTriggerPaymentResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/payments/mpesa/status": {
      "post": {
        "tags": [
          "payment-controller"
        ],
        "operationId": "queryStatus",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/MpesaStatusRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "object",
                  "additionalProperties": {

                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/payments/mpesa/reconciliation/trigger": {
      "post": {
        "tags": [
          "payment-controller"
        ],
        "operationId": "triggerReconciliation",
        "parameters": [
          {
            "name": "date",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ReconciliationSummary"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/payments/mpesa/callback": {
      "post": {
        "tags": [
          "Payment Integration"
        ],
        "summary": "M-Pesa payment callback from Safaricom (no auth required)",
        "operationId": "mpesaCallback_1",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/MpesaCallbackDto"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "string"
                }
              },
              "text/plain": {
                "schema": {
                  "type": "string"
                }
              }
            }
          }
        }
      }
    },
    "/api/payments/mpesa/callback": {
      "post": {
        "tags": [
          "mpesa-common-callback-controller"
        ],
        "operationId": "mpesaCommonCallback",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/MpesaCallbackDto"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "type": "string"
                }
              },
              "*/*": {
                "schema": {
                  "type": "string"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/payments/callback": {
      "post": {
        "tags": [
          "Payment Integration"
        ],
        "summary": "Legacy M-Pesa payment callback - WITHOUT /v1 prefix (DEPRECATED)",
        "operationId": "legacyMpesaCallback",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/MpesaCallbackDto"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "string"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/notification-providers": {
      "get": {
        "tags": [
          "notification-provider-controller"
        ],
        "summary": "Get All Notification Providers",
        "operationId": "getAll_1",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListNotificationProviderResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      },
      "post": {
        "tags": [
          "notification-provider-controller"
        ],
        "summary": "Create Notification Provider",
        "operationId": "create_3",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/NotificationProviderRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseNotificationProviderResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/network/stations": {
      "post": {
        "tags": [
          "station-controller"
        ],
        "operationId": "createStation",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/StationRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseStationResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/network/routers/{routerIdxno}/provision-service-plane": {
      "post": {
        "tags": [
          "router-onboarding-controller"
        ],
        "summary": "Provision AAA Service Plane on router",
        "description": "Configures an onboarded WireGuard router as a PPPoE/Hotspot NAS.",
        "operationId": "provisionServicePlane",
        "parameters": [
          {
            "name": "routerIdxno",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ServicePlaneProvisioningRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseVoid"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/network/routers/validate-connectivity": {
      "post": {
        "tags": [
          "router-onboarding-controller"
        ],
        "summary": "Validate router connectivity and extract hardware info",
        "operationId": "testAndValidate",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/RouterConnectionRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseRouterValidationResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/network/routers/onboard": {
      "post": {
        "tags": [
          "router-onboarding-controller"
        ],
        "summary": "Onboard router to station and persist to topography",
        "operationId": "onboard",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/RouterOnboardRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseNetworkRouter"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/network/routers/onboard-vpn": {
      "post": {
        "tags": [
          "router-onboarding-controller"
        ],
        "summary": "Onboard a MikroTik router via WireGuard VPN tunnel",
        "description": "Allocates a tunnel IP, injects the peer, persists config, and returns ZTP script.",
        "operationId": "onboardVpn",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/OnboardRouterVpnRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseOnboardRouterVpnResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/network/regions": {
      "get": {
        "tags": [
          "region-controller"
        ],
        "operationId": "getAllRegions",
        "parameters": [
          {
            "name": "tree",
            "in": "query",
            "required": false,
            "schema": {
              "type": "boolean",
              "default": false
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListRegionResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "region-controller"
        ],
        "operationId": "createRegion",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/RegionRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseRegionResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/network/provisioning/pppoe": {
      "post": {
        "tags": [
          "provisioning-controller"
        ],
        "operationId": "provisionSubscriberLine",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/SubscriberProvisioningRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseVoid"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/network/locations": {
      "post": {
        "tags": [
          "location-controller"
        ],
        "operationId": "createLocation",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/LocationRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseLocationResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/network-routers/{id}/finalize": {
      "post": {
        "tags": [
          "network-router-controller"
        ],
        "summary": "Finalize discovered router setup",
        "operationId": "finalizeRouter",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/FinalizeRouterRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseNetworkRouter"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/network-devices": {
      "get": {
        "tags": [
          "Network Devices"
        ],
        "summary": "Get all MikroTik devices",
        "operationId": "getAllDevices",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListDeviceResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      },
      "post": {
        "tags": [
          "Network Devices"
        ],
        "summary": "Add a new Network device",
        "operationId": "addDevice",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/AddDeviceRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseDeviceResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/network-devices/wireguard/register": {
      "post": {
        "tags": [
          "WireGuard"
        ],
        "summary": "Register a MikroTik WireGuard peer",
        "description": "Accepts the MikroTik's WireGuard public key, assigns a tunnel IP, updates the server WireGuard config.",
        "operationId": "registerPeer",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/WireGuardRegisterRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseWireGuardCommandResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/network-devices/bulk-import": {
      "post": {
        "tags": [
          "Network Devices"
        ],
        "summary": "Bulk import network devices from JSON",
        "operationId": "bulkImport",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "array",
                "items": {
                  "$ref": "#/components/schemas/AddDeviceRequest"
                }
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListDeviceResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/network-devices/bulk-import/csv": {
      "post": {
        "tags": [
          "Network Devices"
        ],
        "summary": "Bulk import network devices from CSV",
        "operationId": "bulkImportCsv",
        "requestBody": {
          "content": {
            "text/csv": {
              "schema": {
                "type": "string"
              }
            },
            "text/plain": {
              "schema": {
                "type": "string"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListDeviceResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/hotspot/vouchers/create": {
      "post": {
        "tags": [
          "Hotspot"
        ],
        "summary": "Create manual hotspot vouchers in bulk",
        "operationId": "createManualVouchers",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ManualVoucherRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListHotspotSession"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/hotspot/sessions/{sessionId}/disconnect": {
      "post": {
        "tags": [
          "Hotspot"
        ],
        "summary": "Disconnect a session",
        "operationId": "disconnectSession",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseVoid"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/hotspot/reconnect": {
      "post": {
        "tags": [
          "Hotspot"
        ],
        "summary": "Check reconnect status for a device (public)",
        "operationId": "checkReconnect",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/HotspotConnectRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseReconnectResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/hotspot/radius/accounting": {
      "post": {
        "tags": [
          "Hotspot"
        ],
        "summary": "Receive RADIUS hotspot accounting event",
        "operationId": "radiusAccounting",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/HotspotAccountingRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseVoid"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/hotspot/provision/radius/{deviceId}": {
      "post": {
        "tags": [
          "Hotspot"
        ],
        "summary": "Provision MikroTik to use RADIUS for hotspot",
        "operationId": "provisionRadius",
        "parameters": [
          {
            "name": "deviceId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          },
          {
            "name": "radiusServerIp",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "radiusSecret",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseVoid"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/hotspot/provision/radius/{deviceId}/fixup": {
      "post": {
        "tags": [
          "Hotspot"
        ],
        "summary": "Fix existing MikroTik hotspot RADIUS settings without recreating RADIUS entry",
        "operationId": "fixupRadius",
        "parameters": [
          {
            "name": "deviceId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseVoid"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/hotspot/payment/callback": {
      "post": {
        "tags": [
          "Hotspot"
        ],
        "summary": "Hotspot payment callback (M-Pesa) - DEPRECATED: Use /api/v1/payments/mpesa/callback instead",
        "operationId": "hotspotPaymentCallback",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/MpesaCallbackDto"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "string"
                }
              }
            }
          }
        },
        "deprecated": true
      }
    },
    "/api/v1/hotspot/initiate": {
      "post": {
        "tags": [
          "Hotspot"
        ],
        "summary": "Initiate hotspot payment (public)",
        "operationId": "initiatePayment",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/HotspotPaymentRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseHotspotSessionResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/expenses": {
      "get": {
        "tags": [
          "Expenses"
        ],
        "summary": "Get expenses with date range and category filtering",
        "operationId": "getExpenses",
        "parameters": [
          {
            "name": "companyId",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "startDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "name": "endDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "name": "category",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "SALARY",
                "EQUIPMENT",
                "MAINTENANCE",
                "UTILITIES",
                "MARKETING",
                "OTHER"
              ]
            }
          },
          {
            "name": "pageable",
            "in": "query",
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Pageable"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponsePageExpenseResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      },
      "post": {
        "tags": [
          "Expenses"
        ],
        "summary": "Create an expense",
        "operationId": "createExpense",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ExpenseRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseExpenseResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/customers": {
      "get": {
        "tags": [
          "customer-controller"
        ],
        "summary": "Get all customers (paginated)",
        "operationId": "getAll_2",
        "parameters": [
          {
            "name": "page",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "int32",
              "default": 0
            }
          },
          {
            "name": "size",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "int32",
              "default": 10
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponsePageCustomerResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      },
      "post": {
        "tags": [
          "customer-controller"
        ],
        "summary": "Create PPPoE customer",
        "operationId": "create_4",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CustomerRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseCustomerResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/customer-devices": {
      "post": {
        "tags": [
          "Customer Devices"
        ],
        "summary": "Register customer device",
        "description": "Creates a v1 customer device, normalizes its MAC address, validates active PPPoE billing, and writes matching FreeRADIUS radcheck/radreply rows.",
        "operationId": "registerDevice",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CustomerDeviceRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseCustomerDeviceResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/clients/import": {
      "post": {
        "tags": [
          "client-import-controller"
        ],
        "summary": "Import clients from CSV",
        "description": "Requires a Bearer JWT with role SYSADMIN, ADMIN, 01, or 02.",
        "operationId": "importClients",
        "parameters": [
          {
            "name": "dryRun",
            "in": "query",
            "required": false,
            "schema": {
              "type": "boolean",
              "default": false
            }
          }
        ],
        "requestBody": {
          "content": {
            "multipart/form-data": {
              "schema": {
                "type": "object",
                "properties": {
                  "file": {
                    "type": "string",
                    "format": "binary"
                  }
                },
                "required": [
                  "file"
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "CSV import completed",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseImportClientResultDto"
                }
              }
            }
          },
          "400": {
            "description": "Invalid CSV upload",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseImportClientResultDto"
                }
              }
            }
          },
          "401": {
            "description": "Missing, empty, invalid, or expired Bearer JWT",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseImportClientResultDto"
                }
              }
            }
          },
          "403": {
            "description": "Authenticated user is not allowed to import clients",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseImportClientResultDto"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/auth/userlogin": {
      "post": {
        "tags": [
          "auth-controller"
        ],
        "summary": "User Login",
        "operationId": "login",
        "parameters": [
          {
            "name": "X-Forwarded-For",
            "in": "header",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "User-Agent",
            "in": "header",
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/LoginRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseAuthResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/auth/reset-password": {
      "post": {
        "tags": [
          "auth-controller"
        ],
        "operationId": "resetPassword",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ResetPasswordWithOtpRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseVoid"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/auth/refresh-token": {
      "post": {
        "tags": [
          "auth-controller"
        ],
        "summary": "Refresh an active JWT token before expiration",
        "operationId": "refreshToken",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseMapStringString"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/auth/logout": {
      "post": {
        "tags": [
          "auth-controller"
        ],
        "summary": "Revoke current JWT token and log out",
        "operationId": "logout",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseString"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/auth/forgot-password": {
      "post": {
        "tags": [
          "auth-controller"
        ],
        "operationId": "forgotPassword",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ForgotPasswordRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseVoid"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/tickets/{id}/status": {
      "patch": {
        "tags": [
          "Tickets"
        ],
        "summary": "Updates the status of a ticket following the strict workflow",
        "operationId": "updateStatus",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          },
          {
            "name": "status",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "enum": [
                "OPEN",
                "ASSIGNED",
                "IN_PROGRESS",
                "RESOLVED",
                "CLOSED"
              ]
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Ticket status updated successfully",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseTicketResponse"
                }
              }
            }
          },
          "400": {
            "description": "Invalid status transition or ticket closed",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseTicketResponse"
                }
              }
            }
          },
          "404": {
            "description": "Ticket not found",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseTicketResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/tickets/{id}/assign/{agentId}": {
      "patch": {
        "tags": [
          "Tickets"
        ],
        "summary": "Assigns an existing ticket to a support agent",
        "operationId": "assignTicket",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          },
          {
            "name": "agentId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Ticket assigned successfully",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseTicketResponse"
                }
              }
            }
          },
          "400": {
            "description": "Ticket is not in OPEN status",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseTicketResponse"
                }
              }
            }
          },
          "404": {
            "description": "Ticket or Agent not found",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseTicketResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/system/packages/{idxno}": {
      "get": {
        "tags": [
          "Net Packages"
        ],
        "summary": "Get a package by ID",
        "operationId": "getById_2",
        "parameters": [
          {
            "name": "idxno",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseNetPackageResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      },
      "delete": {
        "tags": [
          "Net Packages"
        ],
        "summary": "Permanently delete a package",
        "operationId": "delete_2",
        "parameters": [
          {
            "name": "idxno",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseVoid"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      },
      "patch": {
        "tags": [
          "Net Packages"
        ],
        "summary": "Partially update a package",
        "operationId": "patch",
        "parameters": [
          {
            "name": "idxno",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/NetPackagePatchRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseNetPackageResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/system/packages/{idxno}/deactivate": {
      "patch": {
        "tags": [
          "Net Packages"
        ],
        "summary": "Deactivate a package",
        "operationId": "deactivate",
        "parameters": [
          {
            "name": "idxno",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseNetPackageResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/pppoe/accounts/{id}/suspend": {
      "patch": {
        "tags": [
          "PPPoE Accounts"
        ],
        "summary": "Suspend PPPoE account",
        "operationId": "suspendAccount",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseVoid"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/pppoe/accounts/{id}/activate": {
      "patch": {
        "tags": [
          "PPPoE Accounts"
        ],
        "summary": "Activate PPPoE account",
        "operationId": "activateAccount",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseVoid"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/network-routers/{id}": {
      "get": {
        "tags": [
          "network-router-controller"
        ],
        "summary": "Get router details",
        "operationId": "getRouterDetails",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseNetworkRouter"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      },
      "patch": {
        "tags": [
          "network-router-controller"
        ],
        "summary": "Update router configuration",
        "operationId": "updateRouter",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/FinalizeRouterRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseNetworkRouter"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/network-routers/{id}/action": {
      "patch": {
        "tags": [
          "network-router-controller"
        ],
        "summary": "Execute router action",
        "operationId": "executeRouterAction",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/RouterActionRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseRouterActionResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/customers/{idxno}/toggle-active": {
      "patch": {
        "tags": [
          "customer-controller"
        ],
        "summary": "Toggle customer active status",
        "operationId": "toggleActive",
        "parameters": [
          {
            "name": "idxno",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseCustomerResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/customers/{idxno}/renew": {
      "patch": {
        "tags": [
          "customer-controller"
        ],
        "summary": "Renew subscription (extend expiry)",
        "operationId": "renew",
        "parameters": [
          {
            "name": "idxno",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          },
          {
            "name": "duration",
            "in": "query",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          },
          {
            "name": "unit",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseCustomerResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/customers/{idxno}/change-password": {
      "patch": {
        "tags": [
          "customer-controller"
        ],
        "summary": "Change PPPoE password",
        "operationId": "changePassword",
        "parameters": [
          {
            "name": "idxno",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          },
          {
            "name": "newPassword",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseString"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/tickets/{id}": {
      "get": {
        "tags": [
          "Tickets"
        ],
        "summary": "Retrieves a single ticket by its internal ID",
        "operationId": "getTicket",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Ticket retrieved successfully",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseTicketResponse"
                }
              }
            }
          },
          "404": {
            "description": "Ticket not found",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseTicketResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/tickets/search": {
      "get": {
        "tags": [
          "Tickets"
        ],
        "summary": "Search tickets with advanced filters, pagination, and sorting",
        "operationId": "searchTickets",
        "parameters": [
          {
            "name": "status",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "OPEN",
                "ASSIGNED",
                "IN_PROGRESS",
                "RESOLVED",
                "CLOSED"
              ]
            }
          },
          {
            "name": "priority",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "LOW",
                "MEDIUM",
                "HIGH",
                "URGENT"
              ]
            }
          },
          {
            "name": "assignedAgentId",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          },
          {
            "name": "customerId",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          },
          {
            "name": "routerId",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          },
          {
            "name": "startDate",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "endDate",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "pageable",
            "in": "query",
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Pageable"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponsePageTicketResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/tickets/metrics": {
      "get": {
        "tags": [
          "Tickets"
        ],
        "summary": "Get ticket metrics dashboard data",
        "operationId": "getTicketMetrics",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseTicketMetricsResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/systemsetup/audit-logs": {
      "get": {
        "tags": [
          "audit-log-controller"
        ],
        "summary": "Get all audit logs",
        "operationId": "getAllAuditLogs",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListAuditLogDTO"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/system/users/staff": {
      "get": {
        "tags": [
          "System Users"
        ],
        "summary": "Get all users excluding role code 05 (customers)",
        "operationId": "getStaffUsers",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListSystemUserResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/system/packages/category/{category}": {
      "get": {
        "tags": [
          "Net Packages"
        ],
        "summary": "Get packages by category",
        "operationId": "getByCategory",
        "parameters": [
          {
            "name": "category",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListNetPackageResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/system/packages/active": {
      "get": {
        "tags": [
          "Net Packages"
        ],
        "summary": "Get all active packages",
        "operationId": "getAllActive",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListNetPackageResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/system-setup/{roleCode}/users": {
      "get": {
        "tags": [
          "system-setup-controller"
        ],
        "summary": "Get Users By Role Code",
        "operationId": "getUsersByRole",
        "parameters": [
          {
            "name": "roleCode",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListUserResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/system-setup/parameters": {
      "get": {
        "tags": [
          "system-setup-controller"
        ],
        "summary": "Get System Parameters",
        "operationId": "getParameters",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseMapStringListString"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/system-setup/get-role/{id}": {
      "get": {
        "tags": [
          "system-setup-controller"
        ],
        "summary": "Role By Id",
        "operationId": "getById_3",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseRole"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/system-setup/all-roles": {
      "get": {
        "tags": [
          "system-setup-controller"
        ],
        "summary": "All Roles",
        "operationId": "getAll_3",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListRole"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/system-setup/all-menus": {
      "get": {
        "tags": [
          "system-setup-controller"
        ],
        "summary": "All Menus",
        "operationId": "getMenuTree",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListMenuResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/statements/{statementId}/download": {
      "get": {
        "tags": [
          "Statements"
        ],
        "summary": "Download a generated statement as PDF",
        "operationId": "downloadStatement",
        "parameters": [
          {
            "name": "statementId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "string",
                  "format": "binary"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/statements/customer/{customerId}": {
      "get": {
        "tags": [
          "Statements"
        ],
        "summary": "Get generated statements for a customer",
        "operationId": "getStatementsByCustomer",
        "parameters": [
          {
            "name": "customerId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          },
          {
            "name": "companyId",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "pageable",
            "in": "query",
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Pageable"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponsePageStatementResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/provision/bootstrap": {
      "get": {
        "tags": [
          "router-provisioning-controller"
        ],
        "operationId": "bootstrap",
        "parameters": [
          {
            "name": "token",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "type": "string"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/pppoe/subscriptions/customer/{customerId}": {
      "get": {
        "tags": [
          "PPPoE Subscriptions"
        ],
        "summary": "Get PPPoE subscriptions by customer ID",
        "operationId": "getSubscriptionsByCustomerId",
        "parameters": [
          {
            "name": "customerId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListPppoeSubscriptionResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/pppoe/packages/{id}": {
      "get": {
        "tags": [
          "PPPoE Packages"
        ],
        "summary": "Get PPPoE package by ID",
        "operationId": "getPackageById",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponsePppoePackageResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/pppoe/accounts/{id}": {
      "get": {
        "tags": [
          "PPPoE Accounts"
        ],
        "summary": "Get PPPoE account by ID",
        "operationId": "getAccountById",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponsePppoeAccountResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/pppoe/accounts/customer/{customerId}": {
      "get": {
        "tags": [
          "PPPoE Accounts"
        ],
        "summary": "Get PPPoE accounts by customer ID",
        "operationId": "getAccountsByCustomerId",
        "parameters": [
          {
            "name": "customerId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListPppoeAccountResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/payments": {
      "get": {
        "tags": [
          "Payment Integration"
        ],
        "summary": "Get all payments with optional filters",
        "operationId": "getPayments",
        "parameters": [
          {
            "name": "paymentmode",
            "in": "query",
            "description": "Filter by payment mode e.g. mpesa (optional)",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "issuccessfull",
            "in": "query",
            "description": "Filter by success true/false (optional)",
            "required": false,
            "schema": {
              "type": "boolean"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListTriggerPaymentResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/payments/mpesa/reconciliation": {
      "get": {
        "tags": [
          "payment-controller"
        ],
        "operationId": "getReconciliation",
        "parameters": [
          {
            "name": "date",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "object",
                  "additionalProperties": {

                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/payment-intents/{id}/progress": {
      "get": {
        "tags": [
          "Payment Progress Poller"
        ],
        "summary": "Evaluate live progress of payment settlement and RADIUS/MikroTik session state",
        "operationId": "getProgress",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponsePaymentProgressResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/notification-providers/channel/{channel}": {
      "get": {
        "tags": [
          "notification-provider-controller"
        ],
        "summary": "Get Providers By Channel",
        "operationId": "getByChannel",
        "parameters": [
          {
            "name": "channel",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListNotificationProviderResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/network/stations/location/{locationId}": {
      "get": {
        "tags": [
          "station-controller"
        ],
        "operationId": "getStationsByLocation",
        "parameters": [
          {
            "name": "locationId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListStationResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/network/routers": {
      "get": {
        "tags": [
          "router-onboarding-controller"
        ],
        "summary": "Retrieve all onboarded routers from inventory",
        "operationId": "getAllRouters",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListNetworkRouter"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/network/regions/{id}": {
      "get": {
        "tags": [
          "region-controller"
        ],
        "operationId": "getRegionById",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseRegionResponse"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "region-controller"
        ],
        "operationId": "deleteRegion",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseVoid"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/network/provisioning/station/{stationId}/load": {
      "get": {
        "tags": [
          "provisioning-controller"
        ],
        "operationId": "getStationLoadIndex",
        "parameters": [
          {
            "name": "stationId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListRouterCapacityResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/network/monitoring/router/{routerId}/latest": {
      "get": {
        "tags": [
          "router-monitoring-controller"
        ],
        "operationId": "getLatest",
        "parameters": [
          {
            "name": "routerId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseRouterHealthSnapshot"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/network/monitoring/router/{routerId}/history": {
      "get": {
        "tags": [
          "router-monitoring-controller"
        ],
        "operationId": "getHistory",
        "parameters": [
          {
            "name": "routerId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          },
          {
            "name": "page",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "int32",
              "default": 0
            }
          },
          {
            "name": "size",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "int32",
              "default": 50
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponsePageRouterHealthSnapshot"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/network/locations/region/{regionId}": {
      "get": {
        "tags": [
          "location-controller"
        ],
        "operationId": "getLocationsByRegion",
        "parameters": [
          {
            "name": "regionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListLocationResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/network/ip-pools": {
      "get": {
        "tags": [
          "IPAM & IP Mappings"
        ],
        "summary": "List configured IP pools and live utilization stats",
        "operationId": "getIpPools",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListIpPoolResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/network/ip-mappings": {
      "get": {
        "tags": [
          "IPAM & IP Mappings"
        ],
        "summary": "List active IP-to-subscriber bindings from RADIUS and PPPoE sessions",
        "operationId": "getIpMappings",
        "parameters": [
          {
            "name": "serviceType",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "searchIp",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "pageable",
            "in": "query",
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Pageable"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponsePageIpMappingResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/network-routers/topology": {
      "get": {
        "tags": [
          "network-router-controller"
        ],
        "summary": "Get recursive topology tree",
        "operationId": "getTopologyTree",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListMikrotikTopologyDto"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/network-routers/pending": {
      "get": {
        "tags": [
          "network-router-controller"
        ],
        "summary": "Get pending discovered routers",
        "operationId": "getPendingRouters",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListNetworkRouter"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/network-devices/{id}/status": {
      "get": {
        "tags": [
          "Network Devices"
        ],
        "summary": "Get cached status of a MikroTik device",
        "operationId": "getDeviceStatus",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseDeviceStatusResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/network-devices/{id}/interfaces": {
      "get": {
        "tags": [
          "Network Devices"
        ],
        "summary": "Get interfaces and connected neighbors for a device",
        "operationId": "getInterfaces",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListMapStringString"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/network-devices/{id}/activity": {
      "get": {
        "tags": [
          "Network Devices"
        ],
        "summary": "Get device activity timeline",
        "operationId": "getDeviceActivity",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListDeviceActivityItem"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/network-devices/health-summary": {
      "get": {
        "tags": [
          "Network Devices"
        ],
        "summary": "Get device health dashboard data",
        "operationId": "getHealthSummary",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseDeviceHealthSummary"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/investor/revenue": {
      "get": {
        "tags": [
          "investor-controller"
        ],
        "operationId": "getRevenueSummary",
        "parameters": [
          {
            "name": "investorId",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          },
          {
            "name": "period",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/InvestorRevenueSummaryResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/investor/billing-snapshots": {
      "get": {
        "tags": [
          "investor-controller"
        ],
        "operationId": "getBillingSnapshots",
        "parameters": [
          {
            "name": "investorId",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/InvestorBillingSnapshot"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/investor/agreements": {
      "get": {
        "tags": [
          "investor-controller"
        ],
        "operationId": "getAgreements",
        "parameters": [
          {
            "name": "investorId",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/InvestorAgreement"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/hotspot/sessions/statistics": {
      "get": {
        "tags": [
          "Hotspot"
        ],
        "summary": "Get session statistics per device or customer phone",
        "operationId": "getSessionStatistics",
        "parameters": [
          {
            "name": "deviceId",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          },
          {
            "name": "clientPhone",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseHotspotSessionStatsResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/hotspot/sessions/mac/{macAddress}": {
      "get": {
        "tags": [
          "Hotspot"
        ],
        "summary": "Get session history by MAC address",
        "operationId": "getSessionsByMac",
        "parameters": [
          {
            "name": "macAddress",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListHotspotSessionResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/hotspot/sessions/history": {
      "get": {
        "tags": [
          "Hotspot"
        ],
        "summary": "Get session history with filters",
        "operationId": "getSessionHistory",
        "parameters": [
          {
            "name": "clientPhone",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "deviceId",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          },
          {
            "name": "status",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "startDate",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "endDate",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "pageable",
            "in": "query",
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Pageable"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponsePageHotspotSessionResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/hotspot/sessions/active": {
      "get": {
        "tags": [
          "Hotspot"
        ],
        "summary": "Get active sessions dashboard",
        "operationId": "getActiveSessionsDashboard",
        "parameters": [
          {
            "name": "pageable",
            "in": "query",
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Pageable"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponsePageHotspotSessionResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/hotspot/sessions/active/{deviceId}": {
      "get": {
        "tags": [
          "Hotspot"
        ],
        "summary": "Get active sessions for a device",
        "operationId": "getActiveSessions",
        "parameters": [
          {
            "name": "deviceId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListHotspotSessionResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/hotspot/devices/{phoneNumber}": {
      "get": {
        "tags": [
          "Hotspot"
        ],
        "summary": "Get saved devices for a phone number (public)",
        "operationId": "getSavedDevices",
        "parameters": [
          {
            "name": "phoneNumber",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListSavedDeviceResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/finance/transactions": {
      "get": {
        "tags": [
          "Finance Revenue & Transactions"
        ],
        "summary": "Query paginated ledger postings with multi-dimensional RLS and date filters",
        "operationId": "getTransactions",
        "parameters": [
          {
            "name": "companyId",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "investorId",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "accountCode",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "fromDate",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "toDate",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "pageable",
            "in": "query",
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Pageable"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponsePageAccountPosting"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/finance/revenue": {
      "get": {
        "tags": [
          "Finance Revenue & Transactions"
        ],
        "summary": "Get aggregated revenue and P&L breakdown for dashboard widgets",
        "operationId": "getRevenueSummary_1",
        "parameters": [
          {
            "name": "companyId",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "startDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "name": "endDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseObject"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/finance/reports/station-funds-flow": {
      "get": {
        "tags": [
          "finance-report-controller"
        ],
        "operationId": "getStationFundsFlow",
        "parameters": [
          {
            "name": "stationId",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "startDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "name": "endDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/FundsFlowSummaryResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/finance/reports/profit-loss": {
      "get": {
        "tags": [
          "finance-report-controller"
        ],
        "operationId": "getProfitLoss",
        "parameters": [
          {
            "name": "companyId",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "startDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "endDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ProfitLossReport"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/finance/reports/funds-flow": {
      "get": {
        "tags": [
          "finance-report-controller"
        ],
        "operationId": "getSystemFundsFlow",
        "parameters": [
          {
            "name": "startDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "name": "endDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/FundsFlowSummaryResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/finance/reports/company-funds-flow": {
      "get": {
        "tags": [
          "finance-report-controller"
        ],
        "operationId": "getCompanyFundsFlow",
        "parameters": [
          {
            "name": "companyId",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "startDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "name": "endDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/FundsFlowSummaryResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/finance/reports/cash-flow": {
      "get": {
        "tags": [
          "finance-report-controller"
        ],
        "operationId": "getCashFlow",
        "parameters": [
          {
            "name": "companyId",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "startDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "endDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/CashFlowReport"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/finance/reports/balance-sheet": {
      "get": {
        "tags": [
          "finance-report-controller"
        ],
        "operationId": "getBalanceSheet",
        "parameters": [
          {
            "name": "companyId",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "asOfDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BalanceSheetReport"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/finance/reconciliation/three-way": {
      "get": {
        "tags": [
          "Three-Way Reconciliation"
        ],
        "summary": "Calculate 3-way variance report between Gateway, Ledger, and Service Delivery",
        "operationId": "getThreeWayReport",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseThreeWayReportResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/finance/coa/trial-balance": {
      "get": {
        "tags": [
          "coa-controller"
        ],
        "operationId": "getTrialBalance",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "object",
                  "additionalProperties": {

                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/finance/coa/postings": {
      "get": {
        "tags": [
          "coa-controller"
        ],
        "operationId": "getPostings",
        "parameters": [
          {
            "name": "companyScope",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "accountCode",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "fromDate",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "toDate",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "pageable",
            "in": "query",
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Pageable"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/AccountPosting"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/finance/coa/balance": {
      "get": {
        "tags": [
          "coa-controller"
        ],
        "operationId": "getBalances",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/AccountBalanceProjection"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/finance/coa/": {
      "get": {
        "tags": [
          "coa-controller"
        ],
        "operationId": "getChartOfAccounts",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "object",
                  "additionalProperties": {
                    "type": "array",
                    "items": {
                      "$ref": "#/components/schemas/AccountNode"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/finance/coa": {
      "get": {
        "tags": [
          "coa-controller"
        ],
        "operationId": "getChartOfAccounts_1",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "object",
                  "additionalProperties": {
                    "type": "array",
                    "items": {
                      "$ref": "#/components/schemas/AccountNode"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/expenses/summary": {
      "get": {
        "tags": [
          "Expenses"
        ],
        "summary": "Get expense summary for a date range",
        "operationId": "getExpensesSummary",
        "parameters": [
          {
            "name": "startDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "name": "endDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseExpenseSummary"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/expenses/by-category": {
      "get": {
        "tags": [
          "Expenses"
        ],
        "summary": "Get expense totals grouped by category",
        "operationId": "getExpensesByCategory",
        "parameters": [
          {
            "name": "startDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "name": "endDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseMapExpenseCategoryBigDecimal"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/customer-devices/customer/{customerIdxno}": {
      "get": {
        "tags": [
          "Customer Devices"
        ],
        "summary": "List customer devices",
        "description": "Returns the v1 registered devices for one customer, including locally administered MAC warnings when applicable.",
        "operationId": "getCustomerDevices",
        "parameters": [
          {
            "name": "customerIdxno",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListCustomerDeviceResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/analytics/profit-and-loss": {
      "get": {
        "tags": [
          "Analytics"
        ],
        "summary": "Get profit and loss statement for a date range",
        "operationId": "getProfitAndLoss",
        "parameters": [
          {
            "name": "startDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "name": "endDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseProfitAndLossResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/analytics/profit-and-loss/trend": {
      "get": {
        "tags": [
          "Analytics"
        ],
        "summary": "Get profit and loss trend for a year",
        "operationId": "getProfitAndLossTrend",
        "parameters": [
          {
            "name": "year",
            "in": "query",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          },
          {
            "name": "interval",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "default": "monthly"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListProfitAndLossTrendItem"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/analytics/profit-and-loss/dashboard": {
      "get": {
        "tags": [
          "Analytics"
        ],
        "summary": "Get profit and loss dashboard widgets",
        "operationId": "getProfitAndLossDashboard",
        "parameters": [
          {
            "name": "startDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "name": "endDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseMapStringObject"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/analytics/payments/trend": {
      "get": {
        "tags": [
          "Analytics"
        ],
        "summary": "Get payments trend by interval",
        "operationId": "getPaymentsTrend",
        "parameters": [
          {
            "name": "startDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "name": "endDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "name": "interval",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "default": "monthly"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListPaymentTrendItem"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/analytics/payments/top-customers": {
      "get": {
        "tags": [
          "Analytics"
        ],
        "summary": "Get top customers by completed PPPoE payment total",
        "operationId": "getTopCustomersByPayment",
        "parameters": [
          {
            "name": "startDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "name": "endDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "int32",
              "default": 10
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseListTopCustomerPayment"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/analytics/payments/summary": {
      "get": {
        "tags": [
          "Analytics"
        ],
        "summary": "Get payments summary for a date range",
        "operationId": "getPaymentsSummary",
        "parameters": [
          {
            "name": "startDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "name": "endDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponsePaymentAnalyticsSummary"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/analytics/payments/by-status": {
      "get": {
        "tags": [
          "Analytics"
        ],
        "summary": "Get payment counts grouped by status",
        "operationId": "getPaymentsByStatus",
        "parameters": [
          {
            "name": "startDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "name": "endDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseMapStringLong"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/network/stations/{id}": {
      "delete": {
        "tags": [
          "station-controller"
        ],
        "operationId": "deleteStation",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseVoid"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/network/locations/{id}": {
      "delete": {
        "tags": [
          "location-controller"
        ],
        "operationId": "deleteLocation",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseVoid"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/network-devices/wireguard/{publicKey}": {
      "delete": {
        "tags": [
          "WireGuard"
        ],
        "summary": "Remove a WireGuard peer",
        "description": "Removes the peer from the server WireGuard config.",
        "operationId": "removePeer",
        "parameters": [
          {
            "name": "publicKey",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseVoid"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    },
    "/api/v1/customer-devices/{deviceIdxno}": {
      "delete": {
        "tags": [
          "Customer Devices"
        ],
        "summary": "Delete customer device",
        "description": "Deletes a v1 customer device and removes its FreeRADIUS radcheck/radreply rows.",
        "operationId": "deleteDevice",
        "parameters": [
          {
            "name": "deviceIdxno",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseVoid"
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    }
  },
  "components": {
    "schemas": {
      "UpdateSystemUserRequest": {
        "type": "object",
        "description": "Request object for updating a system user's profile details",
        "properties": {
          "username": {
            "type": "string",
            "description": "Unique username for the system user",
            "example": "john_doe",
            "maxLength": 50,
            "minLength": 3
          },
          "fname": {
            "type": "string",
            "description": "User's first name",
            "example": "John",
            "minLength": 1
          },
          "middleName": {
            "type": "string",
            "description": "User's middle name",
            "example": "M"
          },
          "otherName": {
            "type": "string",
            "description": "User's other name (last name)",
            "example": "Doe"
          },
          "email": {
            "type": "string",
            "description": "Unique email address",
            "example": "john.doe@example.com"
          },
          "phoneNumber": {
            "type": "string",
            "description": "Unique phone number",
            "example": "+254712345678",
            "pattern": "^\\+?[0-9]{7,15}$"
          },
          "isactive": {
            "type": "boolean",
            "description": "Flag indicating if the user is active",
            "example": true
          },
          "canLogin": {
            "type": "boolean",
            "description": "Flag indicating if the user has login privileges",
            "example": true
          },
          "stationId": {
            "type": "string",
            "description": "Station ID for multi-tenant isolation",
            "example": "station-01"
          },
          "companyId": {
            "type": "string",
            "description": "Company ID for multi-tenant isolation",
            "example": "company-01"
          }
        },
        "required": [
          "fname",
          "username"
        ]
      },
      "ApiResponseSystemUserResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/SystemUserResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "SystemUserResponse": {
        "type": "object",
        "properties": {
          "idxno": {
            "type": "integer",
            "format": "int64"
          },
          "username": {
            "type": "string"
          },
          "userId": {
            "type": "string"
          },
          "role": {
            "type": "string"
          },
          "roleName": {
            "type": "string"
          },
          "roleDescription": {
            "type": "string"
          },
          "fname": {
            "type": "string"
          },
          "middleName": {
            "type": "string"
          },
          "otherName": {
            "type": "string"
          },
          "fullName": {
            "type": "string"
          },
          "email": {
            "type": "string"
          },
          "phoneNumber": {
            "type": "string"
          },
          "isactive": {
            "type": "boolean"
          },
          "canLogin": {
            "type": "boolean"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "stationId": {
            "type": "string"
          },
          "companyId": {
            "type": "string"
          }
        }
      },
      "AssignRoleRequest": {
        "type": "object",
        "description": "Request object for assigning a role to a user",
        "properties": {
          "roleCode": {
            "type": "string",
            "description": "The code of the role to assign to the user",
            "example": "02",
            "minLength": 1
          }
        },
        "required": [
          "roleCode"
        ]
      },
      "UpdateRoleRequest": {
        "type": "object",
        "properties": {
          "roleCode": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "description": {
            "type": "string"
          }
        }
      },
      "ApiResponseRole": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/Role"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "Role": {
        "type": "object",
        "properties": {
          "idxno": {
            "type": "integer",
            "format": "int64"
          },
          "roleCode": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "NotificationProviderRequest": {
        "type": "object",
        "properties": {
          "channel": {
            "type": "string",
            "minLength": 1
          },
          "providerName": {
            "type": "string",
            "minLength": 1
          },
          "apiUrl": {
            "type": "string"
          },
          "apiKey": {
            "type": "string"
          },
          "apiSecret": {
            "type": "string"
          },
          "senderId": {
            "type": "string"
          },
          "fromEmail": {
            "type": "string"
          },
          "fromName": {
            "type": "string"
          },
          "isActive": {
            "type": "boolean"
          }
        },
        "required": [
          "channel",
          "providerName"
        ]
      },
      "ApiResponseNotificationProviderResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/NotificationProviderResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "NotificationProviderResponse": {
        "type": "object",
        "properties": {
          "idxno": {
            "type": "integer",
            "format": "int64"
          },
          "channel": {
            "type": "string"
          },
          "providerName": {
            "type": "string"
          },
          "apiUrl": {
            "type": "string"
          },
          "apiKey": {
            "type": "string"
          },
          "senderId": {
            "type": "string"
          },
          "fromEmail": {
            "type": "string"
          },
          "fromName": {
            "type": "string"
          },
          "isActive": {
            "type": "boolean"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "updatedAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "UpdateDeviceRequest": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "ipAddress": {
            "type": "string"
          },
          "port": {
            "type": "integer",
            "format": "int32"
          },
          "deviceType": {
            "type": "string"
          },
          "username": {
            "type": "string"
          },
          "password": {
            "type": "string"
          },
          "snmpCommunity": {
            "type": "string"
          },
          "snmpVersion": {
            "type": "string"
          },
          "site": {
            "type": "string"
          },
          "region": {
            "type": "string"
          },
          "location": {
            "type": "string"
          },
          "maxSessions": {
            "type": "integer",
            "format": "int32"
          },
          "description": {
            "type": "string"
          },
          "stationId": {
            "type": "string"
          },
          "companyId": {
            "type": "string"
          },
          "coaSecret": {
            "type": "string"
          }
        }
      },
      "ApiResponseDeviceResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/DeviceResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "DeviceResponse": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int64"
          },
          "name": {
            "type": "string"
          },
          "ipAddress": {
            "type": "string"
          },
          "port": {
            "type": "integer",
            "format": "int32"
          },
          "location": {
            "type": "string"
          },
          "active": {
            "type": "boolean"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "deviceType": {
            "type": "string"
          },
          "site": {
            "type": "string"
          },
          "region": {
            "type": "string"
          },
          "online": {
            "type": "boolean"
          },
          "apiAuthenticated": {
            "type": "boolean"
          },
          "healthDetail": {
            "type": "string"
          },
          "lastCheckedAt": {
            "type": "string",
            "format": "date-time"
          },
          "lastSeenAt": {
            "type": "string",
            "format": "date-time"
          },
          "cpuLoad": {
            "type": "string"
          },
          "uptime": {
            "type": "string"
          },
          "stationId": {
            "type": "string"
          },
          "companyId": {
            "type": "string"
          }
        }
      },
      "ExpenseRequest": {
        "type": "object",
        "properties": {
          "amount": {
            "type": "number",
            "minimum": 0.01
          },
          "description": {
            "type": "string",
            "maxLength": 255,
            "minLength": 0
          },
          "category": {
            "type": "string",
            "enum": [
              "SALARY",
              "EQUIPMENT",
              "MAINTENANCE",
              "UTILITIES",
              "MARKETING",
              "OTHER"
            ]
          },
          "expenseDate": {
            "type": "string",
            "format": "date"
          },
          "receiptUrl": {
            "type": "string"
          }
        },
        "required": [
          "amount",
          "category",
          "description",
          "expenseDate"
        ]
      },
      "ApiResponseExpenseResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/ExpenseResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ExpenseResponse": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "amount": {
            "type": "number"
          },
          "description": {
            "type": "string"
          },
          "category": {
            "type": "string",
            "enum": [
              "SALARY",
              "EQUIPMENT",
              "MAINTENANCE",
              "UTILITIES",
              "MARKETING",
              "OTHER"
            ]
          },
          "expenseDate": {
            "type": "string",
            "format": "date"
          },
          "receiptUrl": {
            "type": "string"
          },
          "createdById": {
            "type": "integer",
            "format": "int64"
          },
          "createdByUsername": {
            "type": "string"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "updatedAt": {
            "type": "string",
            "format": "date-time"
          },
          "stationId": {
            "type": "string"
          },
          "companyId": {
            "type": "string"
          }
        }
      },
      "CustomerRequest": {
        "type": "object",
        "properties": {
          "username": {
            "type": "string"
          },
          "password": {
            "type": "string"
          },
          "firstname": {
            "type": "string"
          },
          "lname": {
            "type": "string"
          },
          "email": {
            "type": "string"
          },
          "phoneNumber": {
            "type": "string"
          },
          "isActive": {
            "type": "boolean"
          },
          "canLogin": {
            "type": "boolean"
          },
          "acno": {
            "type": "string"
          },
          "packageName": {
            "type": "string"
          },
          "custtype": {
            "type": "string"
          },
          "isSubActive": {
            "type": "boolean"
          },
          "duration": {
            "type": "integer",
            "format": "int32"
          },
          "unit": {
            "type": "string"
          },
          "stationId": {
            "type": "string"
          },
          "companyId": {
            "type": "string"
          }
        }
      },
      "ApiResponseCustomerResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/CustomerResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "CustomerResponse": {
        "type": "object",
        "properties": {
          "userIdxno": {
            "type": "integer",
            "format": "int64"
          },
          "username": {
            "type": "string"
          },
          "firstname": {
            "type": "string"
          },
          "lname": {
            "type": "string"
          },
          "fullName": {
            "type": "string"
          },
          "email": {
            "type": "string"
          },
          "phoneNumber": {
            "type": "string"
          },
          "role": {
            "type": "string"
          },
          "isActive": {
            "type": "boolean"
          },
          "canLogin": {
            "type": "boolean"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "subscriberIdxno": {
            "type": "integer",
            "format": "int64"
          },
          "acno": {
            "type": "string"
          },
          "packageName": {
            "type": "string"
          },
          "custtype": {
            "type": "string"
          },
          "isSubActive": {
            "type": "boolean"
          },
          "expiryDate": {
            "type": "string",
            "format": "date-time"
          },
          "lastActiveDate": {
            "type": "string",
            "format": "date-time"
          },
          "stationId": {
            "type": "string"
          },
          "companyId": {
            "type": "string"
          }
        }
      },
      "TicketRequest": {
        "type": "object",
        "description": "Request object for creating a new support ticket",
        "properties": {
          "title": {
            "type": "string",
            "description": "Short summary of the issue",
            "example": "Unable to connect to PPPoE",
            "minLength": 1
          },
          "description": {
            "type": "string",
            "description": "Detailed description of the problem",
            "example": "Customer reports authentication failure on router R-01",
            "minLength": 1
          },
          "priority": {
            "type": "string",
            "description": "Ticket priority level",
            "enum": [
              "LOW",
              "MEDIUM",
              "HIGH",
              "URGENT"
            ],
            "example": "HIGH"
          },
          "customerId": {
            "type": "integer",
            "format": "int64",
            "description": "ID of the affected customer",
            "example": 101
          },
          "routerId": {
            "type": "integer",
            "format": "int64",
            "description": "ID of the affected router",
            "example": 50
          },
          "creatorUserId": {
            "type": "integer",
            "format": "int64",
            "description": "ID of the staff user creating the ticket",
            "example": 1
          },
          "creatorCustomerId": {
            "type": "integer",
            "format": "int64",
            "description": "ID of the customer creating the ticket (for self-service)",
            "example": 101
          },
          "pppoeAccountId": {
            "type": "string",
            "format": "uuid",
            "description": "PPPoE account ID for automatic router/status troubleshooting context"
          },
          "pppoeUsername": {
            "type": "string",
            "description": "PPPoE username for automatic router/status troubleshooting context",
            "example": "pppoe-12345678"
          },
          "stationId": {
            "type": "string",
            "description": "Station ID for multi-tenant isolation",
            "example": "station-01"
          },
          "companyId": {
            "type": "string",
            "description": "Company ID for multi-tenant isolation",
            "example": "company-01"
          }
        },
        "required": [
          "description",
          "priority",
          "title"
        ]
      },
      "ApiResponseTicketResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/TicketResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "TicketResponse": {
        "type": "object",
        "description": "Response object representing a support ticket",
        "properties": {
          "idxno": {
            "type": "integer",
            "format": "int64",
            "description": "Internal unique identifier",
            "example": 1
          },
          "ticketNumber": {
            "type": "string",
            "description": "Business unique ticket number",
            "example": "TKT-20260527-0001"
          },
          "title": {
            "type": "string",
            "description": "Ticket title",
            "example": "Unable to connect to PPPoE"
          },
          "description": {
            "type": "string",
            "description": "Ticket description",
            "example": "Customer reports authentication failure on router R-01"
          },
          "status": {
            "type": "string",
            "description": "Current ticket status",
            "enum": [
              "OPEN",
              "ASSIGNED",
              "IN_PROGRESS",
              "RESOLVED",
              "CLOSED"
            ],
            "example": "OPEN"
          },
          "priority": {
            "type": "string",
            "description": "Ticket priority",
            "enum": [
              "LOW",
              "MEDIUM",
              "HIGH",
              "URGENT"
            ],
            "example": "HIGH"
          },
          "customerName": {
            "type": "string",
            "description": "Name of the affected customer",
            "example": "John Doe"
          },
          "assignedAgentName": {
            "type": "string",
            "description": "Name of the assigned support agent",
            "example": "Jane Smith"
          },
          "creatorName": {
            "type": "string",
            "description": "Name of the person who created the ticket",
            "example": "System Admin"
          },
          "pppoeAccountId": {
            "type": "string",
            "format": "uuid",
            "description": "Linked PPPoE account ID"
          },
          "pppoeUsername": {
            "type": "string",
            "description": "PPPoE username attached to the ticket"
          },
          "pppoeRouterIp": {
            "type": "string",
            "description": "Router IP mapped to the PPPoE account"
          },
          "pppoeNetworkDeviceId": {
            "type": "integer",
            "format": "int64",
            "description": "NetworkDevice ID mapped to the PPPoE account"
          },
          "pppoeAccountStatus": {
            "type": "string",
            "description": "PPPoE account status at ticket creation"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time",
            "description": "Timestamp when the ticket was created"
          },
          "updatedAt": {
            "type": "string",
            "format": "date-time",
            "description": "Timestamp when the ticket was last updated"
          },
          "slaDeadline": {
            "type": "string",
            "format": "date-time",
            "description": "SLA deadline for resolution"
          },
          "isEscalated": {
            "type": "boolean",
            "description": "Flag indicating if the ticket has breached SLA and been escalated"
          },
          "stationId": {
            "type": "string",
            "description": "Station ID for multi-tenant isolation"
          },
          "companyId": {
            "type": "string",
            "description": "Company ID for multi-tenant isolation"
          }
        }
      },
      "TicketCommentRequest": {
        "type": "object",
        "description": "Request object for adding a comment to a ticket",
        "properties": {
          "comment": {
            "type": "string",
            "description": "The comment text",
            "example": "Technician is on the way to the site.",
            "minLength": 1
          },
          "authorUserId": {
            "type": "integer",
            "format": "int64",
            "description": "ID of the staff user adding the comment",
            "example": 2
          },
          "authorCustomerId": {
            "type": "integer",
            "format": "int64",
            "description": "ID of the customer adding the comment",
            "example": 101
          }
        },
        "required": [
          "comment"
        ]
      },
      "ApiResponseTicketCommentResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/TicketCommentResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "TicketCommentResponse": {
        "type": "object",
        "description": "Response object representing a comment on a ticket",
        "properties": {
          "idxno": {
            "type": "integer",
            "format": "int64",
            "description": "Internal unique identifier",
            "example": 1
          },
          "authorName": {
            "type": "string",
            "description": "Name of the person who wrote the comment",
            "example": "Jane Smith"
          },
          "comment": {
            "type": "string",
            "description": "The comment text",
            "example": "Technician is on the way to the site."
          },
          "createdAt": {
            "type": "string",
            "format": "date-time",
            "description": "Timestamp when the comment was created"
          }
        }
      },
      "NetPackageRequest": {
        "type": "object",
        "properties": {
          "packageName": {
            "type": "string",
            "minLength": 1
          },
          "price": {
            "type": "number",
            "minimum": 0
          },
          "packageCategory": {
            "type": "string"
          },
          "validityType": {
            "type": "string"
          },
          "validityValue": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "bandwidthType": {
            "type": "string"
          },
          "activeStatus": {
            "type": "boolean"
          },
          "speedDownload": {
            "type": "integer",
            "format": "int32"
          },
          "speedUpload": {
            "type": "integer",
            "format": "int32"
          },
          "enableBurst": {
            "type": "boolean"
          },
          "rateLimit": {
            "type": "string"
          },
          "burstLimit": {
            "type": "string"
          },
          "burstThreshold": {
            "type": "string"
          },
          "burstTime": {
            "type": "string"
          },
          "createdBy": {
            "type": "string"
          },
          "maxDevices": {
            "type": "integer",
            "format": "int32"
          },
          "idleTimeoutSeconds": {
            "type": "integer",
            "format": "int32"
          },
          "acctInterimIntervalSeconds": {
            "type": "integer",
            "format": "int32"
          },
          "dataCapMb": {
            "type": "integer",
            "format": "int64"
          },
          "loginTimeWindow": {
            "type": "string"
          }
        },
        "required": [
          "packageName",
          "price"
        ]
      },
      "ApiResponseNetPackageResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/NetPackageResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "NetPackageResponse": {
        "type": "object",
        "properties": {
          "idxno": {
            "type": "integer",
            "format": "int64"
          },
          "packageName": {
            "type": "string"
          },
          "price": {
            "type": "number"
          },
          "packageCategory": {
            "type": "string"
          },
          "validityType": {
            "type": "string"
          },
          "validityValue": {
            "type": "integer",
            "format": "int32"
          },
          "bandwidthType": {
            "type": "string"
          },
          "activeStatus": {
            "type": "boolean"
          },
          "speedDownload": {
            "type": "integer",
            "format": "int32"
          },
          "speedUpload": {
            "type": "integer",
            "format": "int32"
          },
          "enableBurst": {
            "type": "boolean"
          },
          "rateLimit": {
            "type": "string"
          },
          "burstLimit": {
            "type": "string"
          },
          "burstThreshold": {
            "type": "string"
          },
          "burstTime": {
            "type": "string"
          },
          "dateCreated": {
            "type": "string",
            "format": "date-time"
          },
          "createdBy": {
            "type": "string"
          },
          "approvedBy": {
            "type": "string"
          },
          "isApproved": {
            "type": "boolean"
          },
          "maxDevices": {
            "type": "integer",
            "format": "int32"
          },
          "idleTimeoutSeconds": {
            "type": "integer",
            "format": "int32"
          },
          "acctInterimIntervalSeconds": {
            "type": "integer",
            "format": "int32"
          },
          "dataCapMb": {
            "type": "integer",
            "format": "int64"
          },
          "loginTimeWindow": {
            "type": "string"
          }
        }
      },
      "MenuPermission": {
        "type": "object",
        "properties": {
          "menuItemId": {
            "type": "integer",
            "format": "int64"
          },
          "canView": {
            "type": "boolean"
          },
          "canCreate": {
            "type": "boolean"
          },
          "canEdit": {
            "type": "boolean"
          },
          "canDelete": {
            "type": "boolean"
          }
        }
      },
      "RoleMenuPermissionRequest": {
        "type": "object",
        "properties": {
          "permissions": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/MenuPermission"
            }
          }
        }
      },
      "ApiResponseString": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "string"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "RegisterRequest": {
        "type": "object",
        "properties": {
          "username": {
            "type": "string",
            "maxLength": 50,
            "minLength": 3
          },
          "password": {
            "type": "string",
            "maxLength": 2147483647,
            "minLength": 8
          },
          "role": {
            "type": "string",
            "minLength": 1
          },
          "fname": {
            "type": "string",
            "minLength": 1
          },
          "middleName": {
            "type": "string"
          },
          "otherName": {
            "type": "string"
          },
          "email": {
            "type": "string"
          },
          "phoneNumber": {
            "type": "string",
            "pattern": "^\\+?[0-9]{7,15}$"
          },
          "stationId": {
            "type": "string"
          },
          "companyId": {
            "type": "string"
          }
        },
        "required": [
          "fname",
          "password",
          "role",
          "username"
        ]
      },
      "ApiResponseAuthResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/AuthResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "AuthResponse": {
        "type": "object",
        "properties": {
          "username": {
            "type": "string"
          },
          "role": {
            "type": "string"
          },
          "token": {
            "type": "string"
          }
        }
      },
      "CreateRoleRequest": {
        "type": "object",
        "properties": {
          "roleCode": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "description": {
            "type": "string"
          }
        }
      },
      "StatementRequest": {
        "type": "object",
        "properties": {
          "customerId": {
            "type": "string",
            "format": "uuid"
          },
          "startDate": {
            "type": "string",
            "format": "date"
          },
          "endDate": {
            "type": "string",
            "format": "date"
          },
          "yearMonth": {
            "type": "string"
          }
        },
        "required": [
          "customerId"
        ]
      },
      "ApiResponseStatementResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/StatementResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "StatementLineItem": {
        "type": "object",
        "properties": {
          "date": {
            "type": "string",
            "format": "date"
          },
          "description": {
            "type": "string"
          },
          "type": {
            "type": "string"
          },
          "charge": {
            "type": "number"
          },
          "payment": {
            "type": "number"
          }
        }
      },
      "StatementResponse": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "customerId": {
            "type": "string",
            "format": "uuid"
          },
          "startDate": {
            "type": "string",
            "format": "date"
          },
          "endDate": {
            "type": "string",
            "format": "date"
          },
          "pdfUrl": {
            "type": "string"
          },
          "totalCharges": {
            "type": "number"
          },
          "totalPayments": {
            "type": "number"
          },
          "balanceDue": {
            "type": "number"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "stationId": {
            "type": "string"
          },
          "companyId": {
            "type": "string"
          },
          "lineItems": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/StatementLineItem"
            }
          }
        }
      },
      "HotspotAccountingRequest": {
        "type": "object",
        "properties": {
          "username": {
            "type": "string"
          },
          "acctStatusType": {
            "type": "string"
          },
          "callingStationId": {
            "type": "string"
          },
          "framedIpAddress": {
            "type": "string"
          },
          "acctSessionId": {
            "type": "string"
          },
          "acctInputOctets": {
            "type": "integer",
            "format": "int64"
          },
          "acctOutputOctets": {
            "type": "integer",
            "format": "int64"
          }
        }
      },
      "BootstrapTokenRequest": {
        "type": "object",
        "properties": {
          "identity": {
            "type": "string",
            "minLength": 1
          },
          "ipAddress": {
            "type": "string",
            "minLength": 1
          },
          "apiUsername": {
            "type": "string",
            "minLength": 1
          },
          "apiPassword": {
            "type": "string",
            "minLength": 1
          },
          "snmpCommunity": {
            "type": "string",
            "minLength": 1
          },
          "acknowledgeDestructiveReset": {
            "type": "boolean"
          },
          "companyCode": {
            "type": "string"
          },
          "location": {
            "type": "string"
          },
          "region": {
            "type": "string"
          },
          "stationId": {
            "type": "string"
          },
          "site": {
            "type": "string"
          },
          "description": {
            "type": "string"
          }
        },
        "required": [
          "acknowledgeDestructiveReset",
          "apiPassword",
          "apiUsername",
          "identity",
          "ipAddress",
          "snmpCommunity"
        ]
      },
      "ApiResponseBootstrapTokenResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/BootstrapTokenResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "BootstrapTokenResponse": {
        "type": "object",
        "properties": {
          "routerId": {
            "type": "integer",
            "format": "int64"
          },
          "identity": {
            "type": "string"
          },
          "allocatedVpnIp": {
            "type": "string"
          },
          "fetchCommand": {
            "type": "string"
          },
          "expiresAt": {
            "type": "string",
            "format": "date-time"
          },
          "status": {
            "type": "string"
          }
        }
      },
      "ApiResponseVoid": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {

          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "AssignPackageRequest": {
        "type": "object",
        "properties": {
          "customerId": {
            "type": "string",
            "format": "uuid"
          },
          "packageId": {
            "type": "string",
            "format": "uuid"
          },
          "accountId": {
            "type": "string",
            "format": "uuid"
          }
        }
      },
      "RadiusAuthRequest": {
        "type": "object",
        "properties": {
          "username": {
            "type": "string"
          },
          "password": {
            "type": "string"
          },
          "nasIpAddress": {
            "type": "string"
          },
          "routerIp": {
            "type": "string"
          }
        }
      },
      "ApiResponseRadiusAuthResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/RadiusAuthResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "RadiusAuthResponse": {
        "type": "object",
        "properties": {
          "result": {
            "type": "string"
          },
          "reason": {
            "type": "string"
          },
          "mikrotikRateLimit": {
            "type": "string"
          },
          "routerIp": {
            "type": "string"
          }
        }
      },
      "PppoePaymentRequest": {
        "type": "object",
        "properties": {
          "customerId": {
            "type": "string",
            "format": "uuid"
          },
          "phoneNumber": {
            "type": "string"
          },
          "amount": {
            "type": "number"
          },
          "accountId": {
            "type": "string",
            "format": "uuid"
          },
          "subscriptionId": {
            "type": "string",
            "format": "uuid"
          }
        }
      },
      "Body": {
        "type": "object",
        "properties": {
          "stkCallback": {
            "$ref": "#/components/schemas/StkCallback"
          }
        }
      },
      "CallbackItem": {
        "type": "object",
        "properties": {
          "Name": {
            "type": "string"
          },
          "Value": {

          }
        }
      },
      "CallbackMetadata": {
        "type": "object",
        "properties": {
          "Item": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CallbackItem"
            }
          }
        }
      },
      "MpesaCallbackDto": {
        "type": "object",
        "properties": {
          "Body": {
            "$ref": "#/components/schemas/Body"
          }
        }
      },
      "StkCallback": {
        "type": "object",
        "properties": {
          "MerchantRequestID": {
            "type": "string"
          },
          "CheckoutRequestID": {
            "type": "string"
          },
          "ResultCode": {
            "type": "integer",
            "format": "int32"
          },
          "ResultDesc": {
            "type": "string"
          },
          "CallbackMetadata": {
            "$ref": "#/components/schemas/CallbackMetadata"
          }
        }
      },
      "PppoePackageRequest": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1
          },
          "uploadSpeed": {
            "type": "integer",
            "format": "int64"
          },
          "downloadSpeed": {
            "type": "integer",
            "format": "int64"
          },
          "durationDays": {
            "type": "integer",
            "format": "int32"
          },
          "mikrotikRateLimit": {
            "type": "string"
          },
          "maxDevices": {
            "type": "integer",
            "format": "int32"
          },
          "idleTimeoutSeconds": {
            "type": "integer",
            "format": "int32"
          },
          "acctInterimIntervalSeconds": {
            "type": "integer",
            "format": "int32"
          },
          "dataCapMb": {
            "type": "integer",
            "format": "int64"
          },
          "loginTimeWindow": {
            "type": "string"
          }
        },
        "required": [
          "downloadSpeed",
          "durationDays",
          "name",
          "uploadSpeed"
        ]
      },
      "ApiResponsePppoePackageResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/PppoePackageResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "PppoePackageResponse": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "name": {
            "type": "string"
          },
          "uploadSpeed": {
            "type": "integer",
            "format": "int64"
          },
          "downloadSpeed": {
            "type": "integer",
            "format": "int64"
          },
          "durationDays": {
            "type": "integer",
            "format": "int32"
          },
          "mikrotikRateLimit": {
            "type": "string"
          },
          "maxDevices": {
            "type": "integer",
            "format": "int32"
          },
          "idleTimeoutSeconds": {
            "type": "integer",
            "format": "int32"
          },
          "acctInterimIntervalSeconds": {
            "type": "integer",
            "format": "int32"
          },
          "dataCapMb": {
            "type": "integer",
            "format": "int64"
          },
          "loginTimeWindow": {
            "type": "string"
          }
        }
      },
      "PppoeAccountRequest": {
        "type": "object",
        "properties": {
          "customerId": {
            "type": "string",
            "format": "uuid"
          },
          "username": {
            "type": "string"
          },
          "password": {
            "type": "string"
          },
          "routerId": {
            "type": "string",
            "format": "uuid"
          },
          "networkDeviceId": {
            "type": "integer",
            "format": "int64"
          },
          "routerIp": {
            "type": "string"
          },
          "physicalLocation": {
            "type": "string"
          },
          "routerUsername": {
            "type": "string"
          },
          "routerPassword": {
            "type": "string"
          },
          "stationId": {
            "type": "string"
          },
          "companyId": {
            "type": "string"
          }
        }
      },
      "ApiResponsePppoeAccountResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/PppoeAccountResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "PppoeAccountResponse": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "customerId": {
            "type": "string",
            "format": "uuid"
          },
          "username": {
            "type": "string"
          },
          "generatedPassword": {
            "type": "string"
          },
          "routerId": {
            "type": "string",
            "format": "uuid"
          },
          "networkDeviceId": {
            "type": "integer",
            "format": "int64"
          },
          "routerIp": {
            "type": "string"
          },
          "physicalLocation": {
            "type": "string"
          },
          "status": {
            "type": "string",
            "enum": [
              "ACTIVE",
              "SUSPENDED",
              "DISABLED"
            ]
          },
          "stationId": {
            "type": "string"
          },
          "companyId": {
            "type": "string"
          }
        }
      },
      "TriggerPaymentRequest": {
        "type": "object",
        "properties": {
          "packageId": {
            "type": "integer",
            "format": "int64"
          },
          "customerNumber": {
            "type": "string",
            "minLength": 1
          },
          "paymentmode": {
            "type": "string",
            "minLength": 1
          }
        },
        "required": [
          "customerNumber",
          "packageId",
          "paymentmode"
        ]
      },
      "ApiResponseTriggerPaymentResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/TriggerPaymentResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "TriggerPaymentResponse": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "packageId": {
            "type": "integer",
            "format": "int64"
          },
          "packageName": {
            "type": "string"
          },
          "customerNumber": {
            "type": "string"
          },
          "paymentmode": {
            "type": "string"
          },
          "issuccessfull": {
            "type": "boolean"
          },
          "datecreated": {
            "type": "string",
            "format": "date-time"
          },
          "voucherCode": {
            "type": "string"
          },
          "checkoutRequestId": {
            "type": "string"
          },
          "status": {
            "type": "string"
          }
        }
      },
      "MpesaStatusRequest": {
        "type": "object",
        "properties": {
          "checkoutRequestId": {
            "type": "string"
          },
          "receiptNo": {
            "type": "string"
          },
          "valid": {
            "type": "boolean"
          }
        }
      },
      "ReconciliationSummary": {
        "type": "object",
        "properties": {
          "day": {
            "type": "string",
            "format": "date"
          },
          "totalDaraja": {
            "type": "integer",
            "format": "int32"
          },
          "totalIbs": {
            "type": "integer",
            "format": "int32"
          },
          "matched": {
            "type": "integer",
            "format": "int32"
          },
          "unmatchedInIbs": {
            "type": "integer",
            "format": "int32"
          },
          "unmatchedInDaraja": {
            "type": "integer",
            "format": "int32"
          },
          "ambiguous": {
            "type": "integer",
            "format": "int32"
          },
          "autoHealedCount": {
            "type": "integer",
            "format": "int32"
          }
        }
      },
      "StationRequest": {
        "type": "object",
        "properties": {
          "locationIdxno": {
            "type": "integer",
            "format": "int64"
          },
          "name": {
            "type": "string",
            "maxLength": 150,
            "minLength": 0
          },
          "powerType": {
            "type": "string"
          },
          "backhaulType": {
            "type": "string"
          }
        },
        "required": [
          "locationIdxno",
          "name"
        ]
      },
      "ApiResponseStationResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/StationResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "StationResponse": {
        "type": "object",
        "properties": {
          "idxno": {
            "type": "integer",
            "format": "int64"
          },
          "locationIdxno": {
            "type": "integer",
            "format": "int64"
          },
          "locationName": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "powerType": {
            "type": "string"
          },
          "backhaulType": {
            "type": "string"
          },
          "isActive": {
            "type": "boolean"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ServicePlaneProvisioningRequest": {
        "type": "object",
        "properties": {
          "targetLanInterface": {
            "type": "string",
            "minLength": 1
          }
        },
        "required": [
          "targetLanInterface"
        ]
      },
      "RouterConnectionRequest": {
        "type": "object",
        "properties": {
          "ipAddress": {
            "type": "string",
            "minLength": 1
          },
          "port": {
            "type": "integer",
            "format": "int32"
          },
          "username": {
            "type": "string",
            "minLength": 1
          },
          "password": {
            "type": "string",
            "minLength": 1
          }
        },
        "required": [
          "ipAddress",
          "password",
          "port",
          "username"
        ]
      },
      "ApiResponseRouterValidationResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/RouterValidationResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "RouterValidationResponse": {
        "type": "object",
        "properties": {
          "identity": {
            "type": "string"
          },
          "model": {
            "type": "string"
          },
          "architecture": {
            "type": "string"
          },
          "routerosVersion": {
            "type": "string"
          },
          "serialNumber": {
            "type": "string"
          },
          "cpu": {
            "type": "string"
          },
          "cpuCount": {
            "type": "string"
          },
          "totalMemory": {
            "type": "string"
          },
          "freeMemory": {
            "type": "string"
          }
        }
      },
      "RouterOnboardRequest": {
        "type": "object",
        "properties": {
          "stationIdxno": {
            "type": "integer",
            "format": "int64"
          },
          "ipAddress": {
            "type": "string",
            "minLength": 1
          },
          "port": {
            "type": "integer",
            "format": "int32"
          },
          "username": {
            "type": "string",
            "minLength": 1
          },
          "password": {
            "type": "string",
            "minLength": 1
          }
        },
        "required": [
          "ipAddress",
          "password",
          "port",
          "stationIdxno",
          "username"
        ]
      },
      "ApiResponseNetworkRouter": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/NetworkRouter"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "NetworkRouter": {
        "type": "object",
        "properties": {
          "idxno": {
            "type": "integer",
            "format": "int64"
          },
          "name": {
            "type": "string"
          },
          "ipAddress": {
            "type": "string"
          },
          "macAddress": {
            "type": "string"
          },
          "routerType": {
            "type": "string"
          },
          "location": {
            "type": "string"
          },
          "status": {
            "type": "boolean"
          },
          "lastOnline": {
            "type": "string",
            "format": "date-time"
          },
          "uptime": {
            "type": "string"
          },
          "firmwareVersion": {
            "type": "string"
          },
          "model": {
            "type": "string"
          },
          "serialNumber": {
            "type": "string"
          },
          "capacity": {
            "type": "integer",
            "format": "int32"
          },
          "currentLoad": {
            "type": "integer",
            "format": "int32"
          },
          "parentMikrotikId": {
            "type": "integer",
            "format": "int64"
          },
          "connectionType": {
            "type": "string"
          },
          "interfaceUplink": {
            "type": "string"
          },
          "latitude": {
            "type": "number"
          },
          "longitude": {
            "type": "number"
          },
          "installationDate": {
            "type": "string",
            "format": "date-time"
          },
          "lastMaintenance": {
            "type": "string",
            "format": "date-time"
          },
          "notes": {
            "type": "string"
          },
          "dateAdded": {
            "type": "string",
            "format": "date-time"
          },
          "parentRouterId": {
            "type": "integer",
            "format": "int64"
          },
          "hierarchyLevel": {
            "type": "integer",
            "format": "int32"
          },
          "rootRouterId": {
            "type": "integer",
            "format": "int64"
          },
          "path": {
            "type": "string"
          },
          "uplinkRouterPort": {
            "type": "string"
          },
          "downstreamCount": {
            "type": "integer",
            "format": "int32"
          },
          "isGateway": {
            "type": "boolean"
          },
          "managementIp": {
            "type": "string"
          },
          "managementVlan": {
            "type": "integer",
            "format": "int32"
          },
          "lastDiscoveredAt": {
            "type": "string",
            "format": "date-time"
          },
          "discoveryStatus": {
            "type": "string"
          },
          "authenticationStatus": {
            "type": "string"
          },
          "apiPort": {
            "type": "integer",
            "format": "int32"
          },
          "sshPort": {
            "type": "integer",
            "format": "int32"
          },
          "snmpEnabled": {
            "type": "boolean"
          },
          "wireguardEnabled": {
            "type": "boolean"
          },
          "parentInterface": {
            "type": "string"
          },
          "topologyGroup": {
            "type": "string"
          },
          "nodeStatus": {
            "type": "string"
          },
          "autoDiscovered": {
            "type": "boolean"
          },
          "credentialId": {
            "type": "integer",
            "format": "int64"
          },
          "stationIdxno": {
            "type": "integer",
            "format": "int64"
          },
          "routerUsername": {
            "type": "string"
          },
          "routerPassword": {
            "type": "string"
          },
          "vpnIp": {
            "type": "string"
          },
          "wireguardPublicKey": {
            "type": "string"
          },
          "pppoeEnabled": {
            "type": "boolean"
          },
          "hotspotEnabled": {
            "type": "boolean"
          }
        }
      },
      "OnboardRouterVpnRequest": {
        "type": "object",
        "properties": {
          "routerName": {
            "type": "string",
            "minLength": 1
          },
          "mikrotikPublicKey": {
            "type": "string",
            "minLength": 1
          },
          "stationIdxno": {
            "type": "integer",
            "format": "int64"
          },
          "location": {
            "type": "string"
          },
          "description": {
            "type": "string"
          }
        },
        "required": [
          "mikrotikPublicKey",
          "routerName"
        ]
      },
      "ApiResponseOnboardRouterVpnResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/OnboardRouterVpnResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "OnboardRouterVpnResponse": {
        "type": "object",
        "properties": {
          "routerIdxno": {
            "type": "integer",
            "format": "int64"
          },
          "routerName": {
            "type": "string"
          },
          "vpnIp": {
            "type": "string"
          },
          "wireguardPublicKey": {
            "type": "string"
          },
          "ztpScript": {
            "type": "string"
          }
        }
      },
      "RegionRequest": {
        "type": "object",
        "properties": {
          "regionCode": {
            "type": "string",
            "maxLength": 50,
            "minLength": 0
          },
          "name": {
            "type": "string",
            "maxLength": 150,
            "minLength": 0
          },
          "description": {
            "type": "string",
            "maxLength": 255,
            "minLength": 0
          }
        },
        "required": [
          "name",
          "regionCode"
        ]
      },
      "ApiResponseRegionResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/RegionResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "LocationResponse": {
        "type": "object",
        "properties": {
          "idxno": {
            "type": "integer",
            "format": "int64"
          },
          "regionIdxno": {
            "type": "integer",
            "format": "int64"
          },
          "regionName": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "latitude": {
            "type": "number"
          },
          "longitude": {
            "type": "number"
          },
          "isActive": {
            "type": "boolean"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "stations": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/StationResponse"
            }
          }
        }
      },
      "RegionResponse": {
        "type": "object",
        "properties": {
          "idxno": {
            "type": "integer",
            "format": "int64"
          },
          "regionCode": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "isActive": {
            "type": "boolean"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "locations": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/LocationResponse"
            }
          }
        }
      },
      "SubscriberProvisioningRequest": {
        "type": "object",
        "properties": {
          "stationIdxno": {
            "type": "integer",
            "format": "int64"
          },
          "pppoeUsername": {
            "type": "string",
            "minLength": 1
          },
          "pppoePassword": {
            "type": "string",
            "minLength": 1
          }
        },
        "required": [
          "pppoePassword",
          "pppoeUsername",
          "stationIdxno"
        ]
      },
      "LocationRequest": {
        "type": "object",
        "properties": {
          "regionIdxno": {
            "type": "integer",
            "format": "int64"
          },
          "name": {
            "type": "string",
            "maxLength": 150,
            "minLength": 0
          },
          "latitude": {
            "type": "number"
          },
          "longitude": {
            "type": "number"
          }
        },
        "required": [
          "name",
          "regionIdxno"
        ]
      },
      "ApiResponseLocationResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/LocationResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "FinalizeRouterRequest": {
        "type": "object",
        "properties": {
          "routerName": {
            "type": "string"
          },
          "serviceMode": {
            "type": "string"
          },
          "requiresAuthentication": {
            "type": "boolean"
          },
          "routerUsername": {
            "type": "string"
          },
          "routerPassword": {
            "type": "string"
          },
          "hotspotEnabled": {
            "type": "boolean"
          },
          "pppoeEnabled": {
            "type": "boolean"
          },
          "freeInternet": {
            "type": "boolean"
          },
          "monitoringEnabled": {
            "type": "boolean"
          }
        }
      },
      "AddDeviceRequest": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "ipAddress": {
            "type": "string"
          },
          "port": {
            "type": "integer",
            "format": "int32"
          },
          "deviceType": {
            "type": "string"
          },
          "username": {
            "type": "string"
          },
          "password": {
            "type": "string"
          },
          "snmpCommunity": {
            "type": "string"
          },
          "snmpVersion": {
            "type": "string"
          },
          "site": {
            "type": "string"
          },
          "region": {
            "type": "string"
          },
          "location": {
            "type": "string"
          },
          "maxSessions": {
            "type": "integer",
            "format": "int32"
          },
          "description": {
            "type": "string"
          },
          "wireguardPublicKey": {
            "type": "string"
          },
          "stationId": {
            "type": "string"
          },
          "companyId": {
            "type": "string"
          },
          "coaSecret": {
            "type": "string"
          }
        }
      },
      "WireGuardRegisterRequest": {
        "type": "object",
        "properties": {
          "publicKey": {
            "type": "string"
          },
          "deviceName": {
            "type": "string"
          },
          "vpnDnsName": {
            "type": "string"
          },
          "vpnPort": {
            "type": "integer",
            "format": "int32"
          },
          "username": {
            "type": "string"
          },
          "password": {
            "type": "string"
          },
          "site": {
            "type": "string"
          },
          "region": {
            "type": "string"
          },
          "location": {
            "type": "string"
          },
          "maxSessions": {
            "type": "integer",
            "format": "int32"
          },
          "description": {
            "type": "string"
          }
        }
      },
      "ApiResponseWireGuardCommandResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/WireGuardCommandResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "NextStep": {
        "type": "object",
        "properties": {
          "message": {
            "type": "string"
          },
          "endpoint": {
            "type": "string"
          },
          "body": {
            "type": "object",
            "additionalProperties": {

            }
          }
        }
      },
      "WireGuardCommandResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "string"
          },
          "message": {
            "type": "string"
          },
          "tunnelIp": {
            "type": "string"
          },
          "serverPublicKey": {
            "type": "string"
          },
          "commands": {
            "type": "object",
            "additionalProperties": {
              "type": "string"
            }
          },
          "next": {
            "$ref": "#/components/schemas/NextStep"
          }
        }
      },
      "ApiResponseListDeviceResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/DeviceResponse"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ManualVoucherRequest": {
        "type": "object",
        "properties": {
          "packageId": {
            "type": "integer",
            "format": "int64"
          },
          "count": {
            "type": "integer",
            "format": "int32"
          },
          "stationId": {
            "type": "string"
          },
          "companyId": {
            "type": "string"
          }
        }
      },
      "ApiResponseListHotspotSession": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/HotspotSession"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "HotspotSession": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int64"
          },
          "device": {
            "$ref": "#/components/schemas/NetworkDevice"
          },
          "macAddress": {
            "type": "string"
          },
          "ipAddress": {
            "type": "string"
          },
          "clientPhone": {
            "type": "string"
          },
          "payerPhone": {
            "type": "string"
          },
          "mpesaReference": {
            "type": "string"
          },
          "voucherCode": {
            "type": "string"
          },
          "amountPaid": {
            "type": "number"
          },
          "packageId": {
            "type": "integer",
            "format": "int64"
          },
          "packageName": {
            "type": "string"
          },
          "bandwidthProfile": {
            "type": "string"
          },
          "durationHours": {
            "type": "integer",
            "format": "int32"
          },
          "sessionStatus": {
            "type": "string"
          },
          "startedAt": {
            "type": "string",
            "format": "date-time"
          },
          "expiresAt": {
            "type": "string",
            "format": "date-time"
          },
          "endedAt": {
            "type": "string",
            "format": "date-time"
          },
          "sessionTimeout": {
            "type": "integer",
            "format": "int64"
          },
          "concurrentUserLimit": {
            "type": "integer",
            "format": "int32"
          },
          "paymentId": {
            "type": "string",
            "format": "uuid"
          },
          "dataUploadedBytes": {
            "type": "integer",
            "format": "int64"
          },
          "dataDownloadedBytes": {
            "type": "integer",
            "format": "int64"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "stationId": {
            "type": "string"
          },
          "companyId": {
            "type": "string"
          }
        }
      },
      "NetworkDevice": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int64"
          },
          "name": {
            "type": "string"
          },
          "ipAddress": {
            "type": "string"
          },
          "port": {
            "type": "integer",
            "format": "int32"
          },
          "deviceType": {
            "type": "string"
          },
          "username": {
            "type": "string"
          },
          "password": {
            "type": "string"
          },
          "snmpCommunity": {
            "type": "string"
          },
          "snmpVersion": {
            "type": "string"
          },
          "site": {
            "type": "string"
          },
          "region": {
            "type": "string"
          },
          "location": {
            "type": "string"
          },
          "active": {
            "type": "boolean"
          },
          "online": {
            "type": "boolean"
          },
          "apiAuthenticated": {
            "type": "boolean"
          },
          "healthDetail": {
            "type": "string"
          },
          "lastCheckedAt": {
            "type": "string",
            "format": "date-time"
          },
          "lastSeenAt": {
            "type": "string",
            "format": "date-time"
          },
          "cpuLoad": {
            "type": "string"
          },
          "uptime": {
            "type": "string"
          },
          "maxSessions": {
            "type": "integer",
            "format": "int32"
          },
          "currentSessions": {
            "type": "integer",
            "format": "int32"
          },
          "description": {
            "type": "string"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "vpnIp": {
            "type": "string"
          },
          "wireguardPublicKey": {
            "type": "string"
          },
          "wireguardStatus": {
            "type": "string"
          },
          "hotspotSubnet": {
            "type": "string"
          },
          "coaSecret": {
            "type": "string"
          },
          "jsonrecord": {
            "type": "string"
          },
          "stationId": {
            "type": "string"
          },
          "companyId": {
            "type": "string"
          },
          "wanIfIndex": {
            "type": "integer",
            "format": "int32"
          },
          "lanIfIndex": {
            "type": "integer",
            "format": "int32"
          },
          "wanRxMbps": {
            "type": "number",
            "format": "double"
          },
          "wanTxMbps": {
            "type": "number",
            "format": "double"
          },
          "lanRxMbps": {
            "type": "number",
            "format": "double"
          },
          "lanTxMbps": {
            "type": "number",
            "format": "double"
          }
        }
      },
      "HotspotConnectRequest": {
        "type": "object",
        "properties": {
          "deviceId": {
            "type": "integer",
            "format": "int64"
          },
          "username": {
            "type": "string"
          },
          "password": {
            "type": "string"
          },
          "profile": {
            "type": "string"
          },
          "macAddress": {
            "type": "string"
          },
          "clientIp": {
            "type": "string"
          },
          "paymentReference": {
            "type": "string"
          },
          "stationId": {
            "type": "string"
          },
          "companyId": {
            "type": "string"
          }
        }
      },
      "ApiResponseReconnectResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/ReconnectResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "HotspotSessionResponse": {
        "type": "object",
        "properties": {
          "sessionId": {
            "type": "integer",
            "format": "int64"
          },
          "macAddress": {
            "type": "string"
          },
          "clientPhone": {
            "type": "string"
          },
          "payerPhone": {
            "type": "string"
          },
          "packageName": {
            "type": "string"
          },
          "amountPaid": {
            "type": "number"
          },
          "sessionStatus": {
            "type": "string"
          },
          "startedAt": {
            "type": "string",
            "format": "date-time"
          },
          "expiresAt": {
            "type": "string",
            "format": "date-time"
          },
          "minutesRemaining": {
            "type": "integer",
            "format": "int64"
          },
          "mpesaReference": {
            "type": "string"
          },
          "voucherCode": {
            "type": "string"
          },
          "concurrentUserLimit": {
            "type": "integer",
            "format": "int32"
          },
          "durationSeconds": {
            "type": "integer",
            "format": "int64"
          },
          "dataUploadedBytes": {
            "type": "integer",
            "format": "int64"
          },
          "dataDownloadedBytes": {
            "type": "integer",
            "format": "int64"
          },
          "ipAddress": {
            "type": "string"
          },
          "stationId": {
            "type": "string"
          },
          "companyId": {
            "type": "string"
          }
        }
      },
      "ReconnectResponse": {
        "type": "object",
        "properties": {
          "hasActiveSession": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "session": {
            "$ref": "#/components/schemas/HotspotSessionResponse"
          }
        }
      },
      "HotspotPaymentRequest": {
        "type": "object",
        "properties": {
          "packageId": {
            "type": "integer",
            "format": "int64"
          },
          "phone": {
            "type": "string"
          },
          "paymentMode": {
            "type": "string"
          },
          "macAddress": {
            "type": "string"
          },
          "clientMac": {
            "type": "string"
          },
          "clientIp": {
            "type": "string"
          }
        }
      },
      "ApiResponseHotspotSessionResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/HotspotSessionResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "CustomerDeviceRequest": {
        "type": "object",
        "properties": {
          "customerIdxno": {
            "type": "integer",
            "format": "int64"
          },
          "macAddress": {
            "type": "string",
            "minLength": 1,
            "pattern": "(?i)^([0-9a-f]{2}:){5}[0-9a-f]{2}$"
          },
          "deviceName": {
            "type": "string",
            "minLength": 1
          }
        },
        "required": [
          "customerIdxno",
          "deviceName",
          "macAddress"
        ]
      },
      "ApiResponseCustomerDeviceResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/CustomerDeviceResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "CustomerDeviceResponse": {
        "type": "object",
        "properties": {
          "idxno": {
            "type": "integer",
            "format": "int64"
          },
          "customerIdxno": {
            "type": "integer",
            "format": "int64"
          },
          "macAddress": {
            "type": "string"
          },
          "deviceName": {
            "type": "string"
          },
          "status": {
            "type": "string",
            "enum": [
              "ACTIVE",
              "DISABLED"
            ]
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "updatedAt": {
            "type": "string",
            "format": "date-time"
          },
          "locallyAdministeredMac": {
            "type": "boolean"
          },
          "macWarning": {
            "type": "string"
          }
        }
      },
      "ApiResponseImportClientResultDto": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/ImportClientResultDto"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ImportClientErrorDto": {
        "type": "object",
        "properties": {
          "rowNumber": {
            "type": "integer",
            "format": "int64"
          },
          "message": {
            "type": "string"
          }
        }
      },
      "ImportClientResultDto": {
        "type": "object",
        "properties": {
          "totalRows": {
            "type": "integer",
            "format": "int64"
          },
          "successCount": {
            "type": "integer",
            "format": "int64"
          },
          "failedCount": {
            "type": "integer",
            "format": "int64"
          },
          "errors": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ImportClientErrorDto"
            }
          }
        }
      },
      "LoginRequest": {
        "type": "object",
        "properties": {
          "username": {
            "type": "string"
          },
          "password": {
            "type": "string"
          }
        }
      },
      "ResetPasswordWithOtpRequest": {
        "type": "object",
        "properties": {
          "email": {
            "type": "string"
          },
          "otp": {
            "type": "string"
          },
          "newPassword": {
            "type": "string"
          }
        }
      },
      "ApiResponseMapStringString": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "object",
            "additionalProperties": {
              "type": "string"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ForgotPasswordRequest": {
        "type": "object",
        "properties": {
          "email": {
            "type": "string"
          }
        }
      },
      "NetPackagePatchRequest": {
        "type": "object",
        "properties": {
          "packageName": {
            "type": "string"
          },
          "price": {
            "type": "number"
          },
          "packageCategory": {
            "type": "string"
          },
          "validityType": {
            "type": "string"
          },
          "validityValue": {
            "type": "integer",
            "format": "int32"
          },
          "bandwidthType": {
            "type": "string"
          },
          "activeStatus": {
            "type": "boolean"
          },
          "speedDownload": {
            "type": "integer",
            "format": "int32"
          },
          "speedUpload": {
            "type": "integer",
            "format": "int32"
          },
          "enableBurst": {
            "type": "boolean"
          },
          "rateLimit": {
            "type": "string"
          },
          "burstLimit": {
            "type": "string"
          },
          "burstThreshold": {
            "type": "string"
          },
          "burstTime": {
            "type": "string"
          },
          "approvedBy": {
            "type": "string"
          },
          "isApproved": {
            "type": "boolean"
          },
          "maxDevices": {
            "type": "integer",
            "format": "int32"
          },
          "idleTimeoutSeconds": {
            "type": "integer",
            "format": "int32"
          },
          "acctInterimIntervalSeconds": {
            "type": "integer",
            "format": "int32"
          },
          "dataCapMb": {
            "type": "integer",
            "format": "int64"
          },
          "loginTimeWindow": {
            "type": "string"
          }
        }
      },
      "RouterActionRequest": {
        "type": "object",
        "properties": {
          "action": {
            "type": "string",
            "enum": [
              "REBOOT",
              "RESET",
              "ENABLE",
              "DISABLE",
              "DISCONNECT",
              "RECONNECT",
              "PING",
              "REFRESH",
              "HEALTH_CHECK",
              "START_DISCOVERY",
              "STOP_DISCOVERY",
              "BACKUP_CONFIG",
              "RESTORE_CONFIG",
              "UPDATE_FIRMWARE"
            ]
          },
          "notes": {
            "type": "string"
          }
        }
      },
      "ApiResponseRouterActionResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/RouterActionResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "RouterActionResponse": {
        "type": "object",
        "properties": {
          "routerId": {
            "type": "integer",
            "format": "int64"
          },
          "routerName": {
            "type": "string"
          },
          "ipAddress": {
            "type": "string"
          },
          "action": {
            "type": "string"
          },
          "nodeStatus": {
            "type": "string"
          },
          "executionStatus": {
            "type": "string"
          },
          "message": {
            "type": "string"
          },
          "error": {
            "type": "string"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ApiResponseListTicketResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/TicketResponse"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ApiResponseListTicketCommentResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/TicketCommentResponse"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "Pageable": {
        "type": "object",
        "properties": {
          "page": {
            "type": "integer",
            "format": "int32",
            "minimum": 0
          },
          "size": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "sort": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      },
      "ApiResponsePageTicketResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/PageTicketResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "PageTicketResponse": {
        "type": "object",
        "properties": {
          "totalElements": {
            "type": "integer",
            "format": "int64"
          },
          "totalPages": {
            "type": "integer",
            "format": "int32"
          },
          "pageable": {
            "$ref": "#/components/schemas/PageableObject"
          },
          "last": {
            "type": "boolean"
          },
          "first": {
            "type": "boolean"
          },
          "numberOfElements": {
            "type": "integer",
            "format": "int32"
          },
          "size": {
            "type": "integer",
            "format": "int32"
          },
          "content": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/TicketResponse"
            }
          },
          "number": {
            "type": "integer",
            "format": "int32"
          },
          "sort": {
            "$ref": "#/components/schemas/SortObject"
          },
          "empty": {
            "type": "boolean"
          }
        }
      },
      "PageableObject": {
        "type": "object",
        "properties": {
          "paged": {
            "type": "boolean"
          },
          "pageNumber": {
            "type": "integer",
            "format": "int32"
          },
          "pageSize": {
            "type": "integer",
            "format": "int32"
          },
          "unpaged": {
            "type": "boolean"
          },
          "offset": {
            "type": "integer",
            "format": "int64"
          },
          "sort": {
            "$ref": "#/components/schemas/SortObject"
          }
        }
      },
      "SortObject": {
        "type": "object",
        "properties": {
          "sorted": {
            "type": "boolean"
          },
          "unsorted": {
            "type": "boolean"
          },
          "empty": {
            "type": "boolean"
          }
        }
      },
      "ApiResponseTicketMetricsResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/TicketMetricsResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "TicketMetricsResponse": {
        "type": "object",
        "properties": {
          "totalOpen": {
            "type": "integer",
            "format": "int64"
          },
          "inProgress": {
            "type": "integer",
            "format": "int64"
          },
          "resolved": {
            "type": "integer",
            "format": "int64"
          },
          "escalated": {
            "type": "integer",
            "format": "int64"
          },
          "breachedSla": {
            "type": "integer",
            "format": "int64"
          }
        }
      },
      "ApiResponseListAuditLogDTO": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AuditLogDTO"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "AuditLogDTO": {
        "type": "object",
        "properties": {
          "idxno": {
            "type": "integer",
            "format": "int64"
          },
          "username": {
            "type": "string"
          },
          "module": {
            "type": "string"
          },
          "subModule": {
            "type": "string"
          },
          "actionDescription": {
            "type": "string"
          },
          "action": {
            "type": "string"
          },
          "accessTime": {
            "type": "string",
            "format": "date-time"
          },
          "accessTo": {
            "type": "string"
          },
          "stationId": {
            "type": "string"
          },
          "companyId": {
            "type": "string"
          }
        }
      },
      "ApiResponseListSystemUserResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/SystemUserResponse"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ApiResponseListNetPackageResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/NetPackageResponse"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ApiResponseListUserResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/UserResponse"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "UserResponse": {
        "type": "object",
        "properties": {
          "idxno": {
            "type": "integer",
            "format": "int64"
          },
          "username": {
            "type": "string"
          },
          "userId": {
            "type": "string"
          },
          "role": {
            "type": "string"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "isActive": {
            "type": "boolean"
          },
          "fname": {
            "type": "string"
          },
          "middleName": {
            "type": "string"
          },
          "otherName": {
            "type": "string"
          },
          "fullName": {
            "type": "string"
          },
          "email": {
            "type": "string"
          },
          "phoneNumber": {
            "type": "string"
          },
          "canLogin": {
            "type": "boolean"
          },
          "stationId": {
            "type": "string"
          },
          "companyId": {
            "type": "string"
          }
        }
      },
      "ApiResponseListRoleMenuResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/RoleMenuResponse"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "RoleMenuResponse": {
        "type": "object",
        "properties": {
          "label": {
            "type": "string"
          },
          "route": {
            "type": "string"
          },
          "icon": {
            "type": "string"
          },
          "sortOrder": {
            "type": "integer",
            "format": "int32"
          },
          "canView": {
            "type": "boolean"
          },
          "canCreate": {
            "type": "boolean"
          },
          "canEdit": {
            "type": "boolean"
          },
          "canDelete": {
            "type": "boolean"
          }
        }
      },
      "ApiResponseMapStringListString": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "object",
            "additionalProperties": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ApiResponseListRole": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Role"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ApiResponseListMenuResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/MenuResponse"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "MenuResponse": {
        "type": "object",
        "properties": {
          "idxno": {
            "type": "integer",
            "format": "int64"
          },
          "label": {
            "type": "string"
          },
          "route": {
            "type": "string"
          },
          "icon": {
            "type": "string"
          },
          "sortOrder": {
            "type": "integer",
            "format": "int32"
          }
        }
      },
      "ApiResponsePageStatementResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/PageStatementResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "PageStatementResponse": {
        "type": "object",
        "properties": {
          "totalElements": {
            "type": "integer",
            "format": "int64"
          },
          "totalPages": {
            "type": "integer",
            "format": "int32"
          },
          "pageable": {
            "$ref": "#/components/schemas/PageableObject"
          },
          "last": {
            "type": "boolean"
          },
          "first": {
            "type": "boolean"
          },
          "numberOfElements": {
            "type": "integer",
            "format": "int32"
          },
          "size": {
            "type": "integer",
            "format": "int32"
          },
          "content": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/StatementResponse"
            }
          },
          "number": {
            "type": "integer",
            "format": "int32"
          },
          "sort": {
            "$ref": "#/components/schemas/SortObject"
          },
          "empty": {
            "type": "boolean"
          }
        }
      },
      "ApiResponseListPppoeSubscriptionResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/PppoeSubscriptionResponse"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "PppoeSubscriptionResponse": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "customerId": {
            "type": "string",
            "format": "uuid"
          },
          "accountId": {
            "type": "string",
            "format": "uuid"
          },
          "packageId": {
            "type": "string",
            "format": "uuid"
          },
          "packageName": {
            "type": "string"
          },
          "startDate": {
            "type": "string",
            "format": "date"
          },
          "expiryDate": {
            "type": "string",
            "format": "date"
          },
          "daysRemaining": {
            "type": "integer",
            "format": "int64"
          },
          "status": {
            "type": "string",
            "enum": [
              "ACTIVE",
              "EXPIRED",
              "SUSPENDED",
              "CANCELLED"
            ]
          },
          "isActive": {
            "type": "boolean"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "updatedAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ApiResponseListPppoePackageResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/PppoePackageResponse"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ApiResponseListPppoeAccountResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/PppoeAccountResponse"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ApiResponseListTriggerPaymentResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/TriggerPaymentResponse"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ApiResponsePaymentProgressResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/PaymentProgressResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "PaymentProgressResponse": {
        "type": "object",
        "properties": {
          "paymentStatus": {
            "type": "string"
          },
          "entitlementStatus": {
            "type": "string"
          },
          "sessionStatus": {
            "type": "string"
          },
          "connectionState": {
            "type": "string"
          },
          "mpesaReceipt": {
            "type": "string"
          },
          "secondsRemaining": {
            "type": "integer",
            "format": "int64"
          }
        }
      },
      "ApiResponseListNotificationProviderResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/NotificationProviderResponse"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ApiResponseListStationResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/StationResponse"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ApiResponseListNetworkRouter": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/NetworkRouter"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ApiResponseListRegionResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/RegionResponse"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ApiResponseListRouterCapacityResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/RouterCapacityResponse"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "RouterCapacityResponse": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int64"
          },
          "name": {
            "type": "string"
          },
          "ipAddress": {
            "type": "string"
          },
          "currentSessions": {
            "type": "integer",
            "format": "int32"
          },
          "maxSessions": {
            "type": "integer",
            "format": "int32"
          },
          "cpuUsage": {
            "type": "integer",
            "format": "int32"
          },
          "loadFactor": {
            "type": "number",
            "format": "double"
          },
          "healthStatus": {
            "type": "string"
          }
        }
      },
      "ApiResponseRouterHealthSnapshot": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/RouterHealthSnapshot"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "RouterHealthSnapshot": {
        "type": "object",
        "properties": {
          "idxno": {
            "type": "integer",
            "format": "int64"
          },
          "routerId": {
            "type": "integer",
            "format": "int64"
          },
          "cpuUsage": {
            "type": "integer",
            "format": "int32"
          },
          "totalMemory": {
            "type": "integer",
            "format": "int64"
          },
          "freeMemory": {
            "type": "integer",
            "format": "int64"
          },
          "temperature": {
            "type": "number"
          },
          "activePppoeSessions": {
            "type": "integer",
            "format": "int32"
          },
          "activeHotspotSessions": {
            "type": "integer",
            "format": "int32"
          },
          "uptime": {
            "type": "string"
          },
          "latencyMs": {
            "type": "integer",
            "format": "int32"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ApiResponsePageRouterHealthSnapshot": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/PageRouterHealthSnapshot"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "PageRouterHealthSnapshot": {
        "type": "object",
        "properties": {
          "totalElements": {
            "type": "integer",
            "format": "int64"
          },
          "totalPages": {
            "type": "integer",
            "format": "int32"
          },
          "pageable": {
            "$ref": "#/components/schemas/PageableObject"
          },
          "last": {
            "type": "boolean"
          },
          "first": {
            "type": "boolean"
          },
          "numberOfElements": {
            "type": "integer",
            "format": "int32"
          },
          "size": {
            "type": "integer",
            "format": "int32"
          },
          "content": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/RouterHealthSnapshot"
            }
          },
          "number": {
            "type": "integer",
            "format": "int32"
          },
          "sort": {
            "$ref": "#/components/schemas/SortObject"
          },
          "empty": {
            "type": "boolean"
          }
        }
      },
      "ApiResponseListLocationResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/LocationResponse"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ApiResponseListIpPoolResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/IpPoolResponse"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "IpPoolResponse": {
        "type": "object",
        "properties": {
          "poolName": {
            "type": "string"
          },
          "subnet": {
            "type": "string"
          },
          "gateway": {
            "type": "string"
          },
          "totalIps": {
            "type": "integer",
            "format": "int32"
          },
          "usedIps": {
            "type": "integer",
            "format": "int32"
          },
          "availableIps": {
            "type": "integer",
            "format": "int32"
          },
          "utilizationPercentage": {
            "type": "number",
            "format": "double"
          },
          "serviceType": {
            "type": "string"
          }
        }
      },
      "ApiResponsePageIpMappingResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/PageIpMappingResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "IpMappingResponse": {
        "type": "object",
        "properties": {
          "ipAddress": {
            "type": "string"
          },
          "macAddress": {
            "type": "string"
          },
          "username": {
            "type": "string"
          },
          "serviceType": {
            "type": "string"
          },
          "stationName": {
            "type": "string"
          },
          "routerName": {
            "type": "string"
          },
          "status": {
            "type": "string"
          },
          "lastSeen": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "PageIpMappingResponse": {
        "type": "object",
        "properties": {
          "totalElements": {
            "type": "integer",
            "format": "int64"
          },
          "totalPages": {
            "type": "integer",
            "format": "int32"
          },
          "pageable": {
            "$ref": "#/components/schemas/PageableObject"
          },
          "last": {
            "type": "boolean"
          },
          "first": {
            "type": "boolean"
          },
          "numberOfElements": {
            "type": "integer",
            "format": "int32"
          },
          "size": {
            "type": "integer",
            "format": "int32"
          },
          "content": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/IpMappingResponse"
            }
          },
          "number": {
            "type": "integer",
            "format": "int32"
          },
          "sort": {
            "$ref": "#/components/schemas/SortObject"
          },
          "empty": {
            "type": "boolean"
          }
        }
      },
      "ApiResponseListMikrotikTopologyDto": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/MikrotikTopologyDto"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "MikrotikTopologyDto": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int64"
          },
          "name": {
            "type": "string"
          },
          "ipAddress": {
            "type": "string"
          },
          "children": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/TopologyNodeDto"
            }
          }
        }
      },
      "TopologyNodeDto": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int64"
          },
          "name": {
            "type": "string"
          },
          "ipAddress": {
            "type": "string"
          },
          "nodeStatus": {
            "type": "string"
          }
        }
      },
      "ApiResponseDeviceStatusResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/DeviceStatusResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "DeviceStatusResponse": {
        "type": "object",
        "properties": {
          "deviceId": {
            "type": "integer",
            "format": "int64"
          },
          "name": {
            "type": "string"
          },
          "ipAddress": {
            "type": "string"
          },
          "deviceType": {
            "type": "string"
          },
          "online": {
            "type": "boolean"
          },
          "apiAuthenticated": {
            "type": "boolean"
          },
          "healthDetail": {
            "type": "string"
          },
          "lastCheckedAt": {
            "type": "string",
            "format": "date-time"
          },
          "lastSeenAt": {
            "type": "string",
            "format": "date-time"
          },
          "identity": {
            "type": "string"
          },
          "version": {
            "type": "string"
          },
          "uptime": {
            "type": "string"
          },
          "cpuLoad": {
            "type": "string"
          },
          "freeMemory": {
            "type": "string"
          },
          "totalMemory": {
            "type": "string"
          },
          "interfaces": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": {
                "type": "string"
              }
            }
          },
          "neighbors": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": {
                "type": "string"
              }
            }
          },
          "wanRxMbps": {
            "type": "number",
            "format": "double"
          },
          "wanTxMbps": {
            "type": "number",
            "format": "double"
          },
          "lanRxMbps": {
            "type": "number",
            "format": "double"
          },
          "lanTxMbps": {
            "type": "number",
            "format": "double"
          }
        }
      },
      "ApiResponseListMapStringString": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": {
                "type": "string"
              }
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ApiResponseListDeviceActivityItem": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/DeviceActivityItem"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "DeviceActivityItem": {
        "type": "object",
        "properties": {
          "timestamp": {
            "type": "string",
            "format": "date-time"
          },
          "type": {
            "type": "string"
          },
          "description": {
            "type": "string"
          }
        }
      },
      "ApiResponseDeviceHealthSummary": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/DeviceHealthSummary"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "DeviceHealthSummary": {
        "type": "object",
        "properties": {
          "totalDevices": {
            "type": "integer",
            "format": "int64"
          },
          "activeDevices": {
            "type": "integer",
            "format": "int64"
          },
          "onlineDevices": {
            "type": "integer",
            "format": "int64"
          },
          "offlineDevices": {
            "type": "integer",
            "format": "int64"
          },
          "mikrotikDevices": {
            "type": "integer",
            "format": "int64"
          },
          "ciscoDevices": {
            "type": "integer",
            "format": "int64"
          },
          "ubiquitiDevices": {
            "type": "integer",
            "format": "int64"
          },
          "otherDevices": {
            "type": "integer",
            "format": "int64"
          }
        }
      },
      "InvestorRevenueSummaryResponse": {
        "type": "object",
        "properties": {
          "investorId": {
            "type": "string",
            "format": "uuid"
          },
          "periodYearMonth": {
            "type": "string"
          },
          "totalGrossRevenue": {
            "type": "number"
          },
          "hotspotGrossRevenue": {
            "type": "number"
          },
          "hotspotMaintenanceFee": {
            "type": "number"
          },
          "activePppoeSubscribers": {
            "type": "integer",
            "format": "int32"
          },
          "pppoeMaintenanceFee": {
            "type": "number"
          },
          "totalMaintenanceDue": {
            "type": "number"
          },
          "netInvestorPayout": {
            "type": "number"
          },
          "routerBreakdown": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/RouterAttributionItem"
            }
          }
        }
      },
      "RouterAttributionItem": {
        "type": "object",
        "properties": {
          "routerId": {
            "type": "string",
            "format": "uuid"
          },
          "routerName": {
            "type": "string"
          },
          "stationName": {
            "type": "string"
          },
          "hotspotRevenue": {
            "type": "number"
          },
          "pppoeSubscribers": {
            "type": "integer",
            "format": "int32"
          },
          "totalAttributedRevenue": {
            "type": "number"
          }
        }
      },
      "InvestorBillingSnapshot": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "snapshotNumber": {
            "type": "string"
          },
          "companyId": {
            "type": "string",
            "format": "uuid"
          },
          "investorId": {
            "type": "string",
            "format": "uuid"
          },
          "periodYearMonth": {
            "type": "string"
          },
          "hotspotGrossRevenue": {
            "type": "number"
          },
          "hotspotMaintenanceFee": {
            "type": "number"
          },
          "activePppoeSubscribers": {
            "type": "integer",
            "format": "int32"
          },
          "pppoeMaintenanceFee": {
            "type": "number"
          },
          "totalMaintenanceDue": {
            "type": "number"
          },
          "status": {
            "type": "string",
            "enum": [
              "DRAFT",
              "FINALIZED",
              "PAID"
            ]
          },
          "finalizedAt": {
            "type": "string",
            "format": "date-time"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "InvestorAgreement": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "agreementCode": {
            "type": "string"
          },
          "companyId": {
            "type": "string",
            "format": "uuid"
          },
          "investorId": {
            "type": "string",
            "format": "uuid"
          },
          "name": {
            "type": "string"
          },
          "effectiveStartDate": {
            "type": "string",
            "format": "date"
          },
          "effectiveEndDate": {
            "type": "string",
            "format": "date"
          },
          "status": {
            "type": "string",
            "enum": [
              "ACTIVE",
              "TERMINATED"
            ]
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ApiResponseHotspotSessionStatsResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/HotspotSessionStatsResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "HotspotSessionStatsResponse": {
        "type": "object",
        "properties": {
          "totalSessions": {
            "type": "integer",
            "format": "int64"
          },
          "activeSessions": {
            "type": "integer",
            "format": "int64"
          },
          "completedSessions": {
            "type": "integer",
            "format": "int64"
          },
          "pendingSessions": {
            "type": "integer",
            "format": "int64"
          },
          "failedSessions": {
            "type": "integer",
            "format": "int64"
          },
          "totalUploadedBytes": {
            "type": "integer",
            "format": "int64"
          },
          "totalDownloadedBytes": {
            "type": "integer",
            "format": "int64"
          }
        }
      },
      "ApiResponseListHotspotSessionResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/HotspotSessionResponse"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ApiResponsePageHotspotSessionResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/PageHotspotSessionResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "PageHotspotSessionResponse": {
        "type": "object",
        "properties": {
          "totalElements": {
            "type": "integer",
            "format": "int64"
          },
          "totalPages": {
            "type": "integer",
            "format": "int32"
          },
          "pageable": {
            "$ref": "#/components/schemas/PageableObject"
          },
          "last": {
            "type": "boolean"
          },
          "first": {
            "type": "boolean"
          },
          "numberOfElements": {
            "type": "integer",
            "format": "int32"
          },
          "size": {
            "type": "integer",
            "format": "int32"
          },
          "content": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/HotspotSessionResponse"
            }
          },
          "number": {
            "type": "integer",
            "format": "int32"
          },
          "sort": {
            "$ref": "#/components/schemas/SortObject"
          },
          "empty": {
            "type": "boolean"
          }
        }
      },
      "ApiResponseListSavedDeviceResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/SavedDeviceResponse"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "SavedDeviceResponse": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int64"
          },
          "macAddress": {
            "type": "string"
          },
          "deviceName": {
            "type": "string"
          },
          "deviceType": {
            "type": "string"
          },
          "lastUsedAt": {
            "type": "string"
          },
          "timesUsed": {
            "type": "integer",
            "format": "int32"
          }
        }
      },
      "AccountPosting": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "accountCode": {
            "type": "string"
          },
          "sourceType": {
            "type": "string"
          },
          "sourceId": {
            "type": "string",
            "format": "uuid"
          },
          "amount": {
            "type": "number"
          },
          "currency": {
            "type": "string"
          },
          "occurredAt": {
            "type": "string",
            "format": "date-time"
          },
          "memo": {
            "type": "string"
          },
          "companyId": {
            "type": "string"
          },
          "regionId": {
            "type": "integer",
            "format": "int64"
          },
          "locationId": {
            "type": "integer",
            "format": "int64"
          },
          "stationId": {
            "type": "integer",
            "format": "int64"
          },
          "routerId": {
            "type": "integer",
            "format": "int64"
          },
          "investorId": {
            "type": "string",
            "format": "uuid"
          },
          "serviceType": {
            "type": "string"
          },
          "packageId": {
            "type": "integer",
            "format": "int64"
          },
          "pppoePackageId": {
            "type": "string",
            "format": "uuid"
          },
          "customerId": {
            "type": "integer",
            "format": "int64"
          },
          "transactionId": {
            "type": "string",
            "format": "uuid"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ApiResponsePageAccountPosting": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/PageAccountPosting"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "PageAccountPosting": {
        "type": "object",
        "properties": {
          "totalElements": {
            "type": "integer",
            "format": "int64"
          },
          "totalPages": {
            "type": "integer",
            "format": "int32"
          },
          "pageable": {
            "$ref": "#/components/schemas/PageableObject"
          },
          "last": {
            "type": "boolean"
          },
          "first": {
            "type": "boolean"
          },
          "numberOfElements": {
            "type": "integer",
            "format": "int32"
          },
          "size": {
            "type": "integer",
            "format": "int32"
          },
          "content": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AccountPosting"
            }
          },
          "number": {
            "type": "integer",
            "format": "int32"
          },
          "sort": {
            "$ref": "#/components/schemas/SortObject"
          },
          "empty": {
            "type": "boolean"
          }
        }
      },
      "ApiResponseObject": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {

          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "FundsFlowSummaryResponse": {
        "type": "object",
        "properties": {
          "scopeLevel": {
            "type": "string"
          },
          "scopeId": {
            "type": "string"
          },
          "startDate": {
            "type": "string",
            "format": "date"
          },
          "endDate": {
            "type": "string",
            "format": "date"
          },
          "mpesaInTransit": {
            "type": "number"
          },
          "bankSettledFunds": {
            "type": "number"
          },
          "pettyCashFunds": {
            "type": "number"
          },
          "totalGrossCollected": {
            "type": "number"
          },
          "totalUnreconciled": {
            "type": "number"
          },
          "stationCollections": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/StationCollectionItem"
            }
          }
        }
      },
      "StationCollectionItem": {
        "type": "object",
        "properties": {
          "stationId": {
            "type": "integer",
            "format": "int64"
          },
          "stationName": {
            "type": "string"
          },
          "hotspotCollections": {
            "type": "number"
          },
          "pppoeCollections": {
            "type": "number"
          },
          "totalCollections": {
            "type": "number"
          },
          "activeSubscribers": {
            "type": "integer",
            "format": "int32"
          }
        }
      },
      "ProfitLossReport": {
        "type": "object",
        "properties": {
          "companyId": {
            "type": "string"
          },
          "startDate": {
            "type": "string",
            "format": "date-time"
          },
          "endDate": {
            "type": "string",
            "format": "date-time"
          },
          "revenue": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ReportLineItem"
            }
          },
          "expenses": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ReportLineItem"
            }
          },
          "totalRevenue": {
            "type": "number"
          },
          "totalExpenses": {
            "type": "number"
          },
          "netIncome": {
            "type": "number"
          }
        }
      },
      "ReportLineItem": {
        "type": "object",
        "properties": {
          "accountCode": {
            "type": "string"
          },
          "accountName": {
            "type": "string"
          },
          "amount": {
            "type": "number"
          }
        }
      },
      "CashFlowReport": {
        "type": "object",
        "properties": {
          "companyId": {
            "type": "string"
          },
          "startDate": {
            "type": "string",
            "format": "date-time"
          },
          "endDate": {
            "type": "string",
            "format": "date-time"
          },
          "cashInflows": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ReportLineItem"
            }
          },
          "cashOutflows": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ReportLineItem"
            }
          },
          "netCashFlow": {
            "type": "number"
          },
          "openingCashBalance": {
            "type": "number"
          },
          "closingCashBalance": {
            "type": "number"
          }
        }
      },
      "BalanceSheetReport": {
        "type": "object",
        "properties": {
          "companyId": {
            "type": "string"
          },
          "asOfDate": {
            "type": "string",
            "format": "date-time"
          },
          "assets": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ReportLineItem"
            }
          },
          "liabilities": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ReportLineItem"
            }
          },
          "equity": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ReportLineItem"
            }
          },
          "totalAssets": {
            "type": "number"
          },
          "totalLiabilities": {
            "type": "number"
          },
          "totalEquity": {
            "type": "number"
          },
          "isBalanced": {
            "type": "boolean"
          }
        }
      },
      "ApiResponseThreeWayReportResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/ThreeWayReportResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ThreeWayReportResponse": {
        "type": "object",
        "properties": {
          "totalReceivedMpesa": {
            "type": "number"
          },
          "matchedOrdersValue": {
            "type": "number"
          },
          "serviceDeliveredValue": {
            "type": "number"
          },
          "disruptionCreditsValue": {
            "type": "number"
          },
          "unmatchedGatewayValue": {
            "type": "number"
          },
          "balanced": {
            "type": "boolean"
          }
        }
      },
      "AccountBalanceProjection": {
        "type": "object",
        "properties": {
          "postingCount": {
            "type": "integer",
            "format": "int64"
          },
          "accountCode": {
            "type": "string"
          },
          "balance": {
            "type": "number"
          }
        }
      },
      "AccountNode": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "type": {
            "type": "string"
          },
          "parentCode": {
            "type": "string"
          }
        }
      },
      "ApiResponsePageExpenseResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/PageExpenseResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "PageExpenseResponse": {
        "type": "object",
        "properties": {
          "totalElements": {
            "type": "integer",
            "format": "int64"
          },
          "totalPages": {
            "type": "integer",
            "format": "int32"
          },
          "pageable": {
            "$ref": "#/components/schemas/PageableObject"
          },
          "last": {
            "type": "boolean"
          },
          "first": {
            "type": "boolean"
          },
          "numberOfElements": {
            "type": "integer",
            "format": "int32"
          },
          "size": {
            "type": "integer",
            "format": "int32"
          },
          "content": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ExpenseResponse"
            }
          },
          "number": {
            "type": "integer",
            "format": "int32"
          },
          "sort": {
            "$ref": "#/components/schemas/SortObject"
          },
          "empty": {
            "type": "boolean"
          }
        }
      },
      "ApiResponseExpenseSummary": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/ExpenseSummary"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ExpenseSummary": {
        "type": "object",
        "properties": {
          "startDate": {
            "type": "string",
            "format": "date"
          },
          "endDate": {
            "type": "string",
            "format": "date"
          },
          "totalExpenses": {
            "type": "number"
          },
          "expenseCount": {
            "type": "integer",
            "format": "int64"
          },
          "expensesByCategory": {
            "type": "object",
            "additionalProperties": {
              "type": "number"
            }
          }
        }
      },
      "ApiResponseMapExpenseCategoryBigDecimal": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "object",
            "additionalProperties": {
              "type": "number"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ApiResponsePageCustomerResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/PageCustomerResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "PageCustomerResponse": {
        "type": "object",
        "properties": {
          "totalElements": {
            "type": "integer",
            "format": "int64"
          },
          "totalPages": {
            "type": "integer",
            "format": "int32"
          },
          "pageable": {
            "$ref": "#/components/schemas/PageableObject"
          },
          "last": {
            "type": "boolean"
          },
          "first": {
            "type": "boolean"
          },
          "numberOfElements": {
            "type": "integer",
            "format": "int32"
          },
          "size": {
            "type": "integer",
            "format": "int32"
          },
          "content": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CustomerResponse"
            }
          },
          "number": {
            "type": "integer",
            "format": "int32"
          },
          "sort": {
            "$ref": "#/components/schemas/SortObject"
          },
          "empty": {
            "type": "boolean"
          }
        }
      },
      "ApiResponseListCustomerDeviceResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CustomerDeviceResponse"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ApiResponseProfitAndLossResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/ProfitAndLossResponse"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ProfitAndLossResponse": {
        "type": "object",
        "properties": {
          "startDate": {
            "type": "string",
            "format": "date"
          },
          "endDate": {
            "type": "string",
            "format": "date"
          },
          "totalRevenue": {
            "type": "number"
          },
          "totalExpenses": {
            "type": "number"
          },
          "netProfitLoss": {
            "type": "number"
          },
          "expenseBreakdown": {
            "type": "object",
            "additionalProperties": {
              "type": "number"
            }
          },
          "revenueBreakdown": {
            "type": "object",
            "additionalProperties": {
              "type": "number"
            }
          }
        }
      },
      "ApiResponseListProfitAndLossTrendItem": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ProfitAndLossTrendItem"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ProfitAndLossTrendItem": {
        "type": "object",
        "properties": {
          "periodStart": {
            "type": "string",
            "format": "date"
          },
          "periodEnd": {
            "type": "string",
            "format": "date"
          },
          "revenue": {
            "type": "number"
          },
          "expenses": {
            "type": "number"
          },
          "netProfitLoss": {
            "type": "number"
          }
        }
      },
      "ApiResponseMapStringObject": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "object",
            "additionalProperties": {

            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ApiResponseListPaymentTrendItem": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/PaymentTrendItem"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "PaymentTrendItem": {
        "type": "object",
        "properties": {
          "periodStart": {
            "type": "string",
            "format": "date"
          },
          "periodEnd": {
            "type": "string",
            "format": "date"
          },
          "totalRevenue": {
            "type": "number"
          },
          "paymentCount": {
            "type": "integer",
            "format": "int64"
          }
        }
      },
      "ApiResponseListTopCustomerPayment": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/TopCustomerPayment"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "TopCustomerPayment": {
        "type": "object",
        "properties": {
          "customerId": {
            "type": "string",
            "format": "uuid"
          },
          "totalPaid": {
            "type": "number"
          }
        }
      },
      "ApiResponsePaymentAnalyticsSummary": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/PaymentAnalyticsSummary"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "PaymentAnalyticsSummary": {
        "type": "object",
        "properties": {
          "totalRevenue": {
            "type": "number"
          },
          "paymentCount": {
            "type": "integer",
            "format": "int64"
          },
          "averagePayment": {
            "type": "number"
          },
          "successfulPayments": {
            "type": "integer",
            "format": "int64"
          },
          "failedPayments": {
            "type": "integer",
            "format": "int64"
          }
        }
      },
      "ApiResponseMapStringLong": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "success": {
            "type": "boolean"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "object",
            "additionalProperties": {
              "type": "integer",
              "format": "int64"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      }
    },
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "description": "Enter your JWT token",
        "name": "bearerAuth",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    }
  }
}