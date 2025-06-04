CREATE TABLE IF NOT EXISTS users (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    full_name      VARCHAR(255) NOT NULL,
    email          VARCHAR(255) UNIQUE NOT NULL,
    password       VARCHAR(255) NOT NULL,
    phone          VARCHAR(20),
    role           ENUM('USER', 'BUSINESS_OWNER', 'ADMIN') NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS restaurants (
    id                  INT PRIMARY KEY AUTO_INCREMENT,
    owner_id            INT NOT NULL,
    name                VARCHAR(255) NOT NULL,
    address             TEXT NOT NULL,
    hotline             VARCHAR(20) NOT NULL,
    description         TEXT,
    menu_image          JSON,
    restaurant_image    JSON,
    coordinate          POINT,
    price_min           INT UNSIGNED NOT NULL,
    price_max           INT UNSIGNED NOT NULL,
    status              ENUM('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED') DEFAULT 'PENDING',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES Users(id) ON DELETE CASCADE,
);

CREATE TABLE IF NOT EXISTS restaurant_open_times (
  id INT PRIMARY KEY AUTO_INCREMENT,
  restaurant_id INT NOT NULL,
  day_of_week ENUM('T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN') NOT NULL,
  lunch_from TIME,
  lunch_to TIME,
  dinner_from TIME,
  dinner_to TIME,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categories (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS restaurant_categories (
    restaurant_id INT NOT NULL,
    category_id   INT NOT NULL,
    PRIMARY KEY (restaurant_id, category_id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tables (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id  INT NOT NULL,
    table_type     ENUM('2', '4', '6') NOT NULL,
    quantity       INT NOT NULL,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reservations (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    user_id        INT,
    phone          VARCHAR(20),
    email          VARCHAR(255),
    full_name      VARCHAR(255),
    promotion_id   INT DEFAULT NULL,
    restaurant_id  INT NOT NULL,
    guest_count    INT NOT NULL,
    arrival_time   TIME NOT NULL;
    date           DATE NOT NULL,
    time_slot      ENUM('LUNCH', 'DINNER') NOT NULL,
    status         ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED') DEFAULT 'PENDING',
    note           TEXT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE
    FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS reservation_tables (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    reservation_id  INT NOT NULL,
    table_id        INT NOT NULL,
    status          ENUM('HOLDING', 'CONFIRMED') DEFAULT 'HOLDING',
    hold_expiration TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    user_id        INT NOT NULL,
    restaurant_id  INT NOT NULL,
    rating         ENUM('1', '2', '3', '4', '5') NOT NULL,
    comment        TEXT,
    image          VARCHAR(255),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS promotions (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id  INT NOT NULL,
    title          VARCHAR(255) NOT NULL,
    description    TEXT NOT NULL,
    discount       DECIMAL(5,2) NOT NULL,
    start_date     DATE NOT NULL,
    end_date       DATE NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    user_id        INT,
    message        TEXT NOT NULL,
    response       TEXT NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL
);
