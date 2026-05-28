FROM php:8.3-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    default-mysql-client

# Clear apt cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Install Composer (copied from the official image)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy existing application directory contents
COPY . .

# Install PHP dependencies at build time so the container boots fast.
RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-scripts

# Entrypoint handles key:generate, DB wait, migrate, seed, storage:link.
RUN chmod +x /var/www/docker-entrypoint.sh

# Expose port 8000
EXPOSE 8000

# First-boot setup then serve.
ENTRYPOINT ["/var/www/docker-entrypoint.sh"]
