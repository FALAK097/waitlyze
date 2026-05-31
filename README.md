# Waitlyze

This is a [Next.js](https://nextjs.org/) project designed to help users create stunning waitlists quickly and efficiently. The application features a no-code designer, customizable forms, and real-time analytics to enhance user engagement and conversion rates.

## Getting Started

To set up the project locally, follow these steps:

### Prerequisites

Make sure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (version 18 or higher)
- [pnpm](https://pnpm.io/)

### Clone the Repository

First, clone the repository to your local machine:

```bash
git clone git@github.com:FALAK097/Waitlyze.git
cd Waitlyze
```

### Install Dependencies

Next, install the project dependencies:

```bash
pnpm install
```

### Set Up Environment Variables

Create a `.env` file in the root of the project and add the following environment variables:

```bash
cp .env.example .env
```

Fill in the values of the environment variables.

### Run PostgreSQL Locally with Docker

To run PostgreSQL locally, you can use Docker. First, ensure you have Docker installed on your machine. Then, run the following command to start a PostgreSQL container:

```bash
docker-compose up

This command will create a new PostgreSQL container named "waitlist-db" with the specified user, password, and database.
```

### Run Database Migrations

Run the following command to set up the database schema:

``` bash
pnpm prisma migrate dev
```

### Start the Development Server

Now, you can start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
