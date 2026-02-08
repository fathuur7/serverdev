# Systemd Service Setup

This document explains how to set up and manage the S.Net backend service using systemd.

## Service File

The `snet-backend.service` file is included in this repository and will be automatically installed during deployment.

## Manual Installation

If you need to manually install or update the service:

```bash
# Copy the service file to systemd directory
sudo cp snet-backend.service /etc/systemd/system/

# Reload systemd to recognize the new service
sudo systemctl daemon-reload

# Enable the service to start on boot
sudo systemctl enable snet-backend

# Start the service
sudo systemctl start snet-backend

# Check service status
sudo systemctl status snet-backend
```

## Service Management

```bash
# Start the service
sudo systemctl start snet-backend

# Stop the service
sudo systemctl stop snet-backend

# Restart the service
sudo systemctl restart snet-backend

# Check service status
sudo systemctl status snet-backend

# View logs
sudo journalctl -u snet-backend -f

# View recent logs
sudo journalctl -u snet-backend -n 100
```

## Configuration

The service is configured with the following settings:

- **User**: fathur
- **Working Directory**: /home/fathur/serverdev
- **Command**: /home/fathur/.bun/bin/bun run src/index.ts
- **Port**: 3000 (configured in src/index.ts)
- **Auto-restart**: Yes (with 10 second delay)

## Prerequisites

Before the service can run, ensure:

1. Bun is installed at `/home/fathur/.bun/bin/bun`
2. PostgreSQL is running
3. Redis is running
4. `.env` file is configured in the project directory
5. Dependencies are installed (`bun install`)
6. Prisma client is generated (`bun x prisma generate`)

## Deployment

The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically:

1. Pulls the latest code
2. Installs dependencies
3. Generates Prisma client
4. Installs the systemd service (if not already installed)
5. Restarts the service
6. Verifies the service is running

## Troubleshooting

If the service fails to start:

```bash
# Check service status
sudo systemctl status snet-backend

# View detailed logs
sudo journalctl -u snet-backend -n 50

# Check if the port is already in use
sudo lsof -i :3000

# Verify Bun is installed
/home/fathur/.bun/bin/bun --version

# Check file permissions
ls -la /home/fathur/serverdev
```

## Environment Variables

The service uses environment variables from the `.env` file in the project directory. Make sure all required variables are set:

- Database connection settings
- Redis connection settings
- JWT secrets
- Email configuration
- Other application-specific settings
