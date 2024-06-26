## API Documentation

### Base URLs

- Users: `http://localhost:5000/api/users`
- Transactions: `http://localhost:5000/api/transactions`

### Endpoints

#### Users

##### 1. Get Users

- **Endpoint:** `/`
- **Method:** `GET`
- **Description:** Retrieve a list of all users.
- **Response:**
  - **Status 200:** List of users
  - **Status 500:** Internal Server Error

##### 2. Create User

- **Endpoint:** `/`
- **Method:** `POST`
- **Description:** Create a new user.
- **Request Body:**
  - **Fields:**
    - `name` (string) - **required**
    - `email` (string) - **required**, **unique**
    - `password` (string) - **required**
- **Response:**
  - **Status 201:** User created successfully
  - **Status 400:** Bad Request
  - **Status 500:** Internal Server Error

#### Transactions

##### 1. Get Transactions

- **Endpoint:** `/`
- **Method:** `GET`
- **Description:** Retrieve a list of all transactions.
- **Response:**
  - **Status 200:** List of transactions
  - **Status 500:** Internal Server Error

##### 2. Create Transaction

- **Endpoint:** `/`
- **Method:** `POST`
- **Description:** Create a new transaction.
- **Request Body:**
  - **Fields:**
    - `amount` (number) - **required**
    - `date` (date) - **required**
    - `description` (string) - **required**
- **Response:**
  - **Status 201:** Transaction created successfully
  - **Status 400:** Bad Request
  - **Status 500:** Internal Server Error

### Example Requests

#### Get Users

**Request:**

```http
GET /api/users HTTP/1.1
Host: localhost:5000
Content-Type: application/json
```

**Response:**

```json
[
  {
    "_id": "60c72b2f9b1e8c1a4c8d1e58",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "hashed_password",
    "__v": 0
  }
]
```

#### Create User

**Request:**

```http
POST /api/users HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "password": "securepassword123"
}
```

**Response:**

```json
{
  "_id": "60c72b3f9b1e8c1a4c8d1e59",
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "password": "hashed_password",
  "__v": 0
}
```

#### Get Transactions

**Request:**

```http
GET /api/transactions HTTP/1.1
Host: localhost:5000
Content-Type: application/json
```

**Response:**

```json
[
  {
    "_id": "60c72b4f9b1e8c1a4c8d1e60",
    "amount": 100.0,
    "date": "2023-06-26T00:00:00.000Z",
    "description": "Payment for services",
    "__v": 0
  }
]
```

#### Create Transaction

**Request:**

```http
POST /api/transactions HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "amount": 150.0,
  "date": "2023-06-27T00:00:00.000Z",
  "description": "Invoice payment"
}
```

**Response:**

```json
{
  "_id": "60c72b5f9b1e8c1a4c8d1e61",
  "amount": 150.0,
  "date": "2023-06-27T00:00:00.000Z",
  "description": "Invoice payment",
  "__v": 0
}
```

