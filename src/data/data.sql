CREATE TABLE IF NOT EXISTS Users (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    full_name      VARCHAR(255) NOT NULL,
    email          VARCHAR(255) UNIQUE NOT NULL,
    password       VARCHAR(255) NOT NULL,
    phone          VARCHAR(20),
    role           ENUM('USER', 'BUSINESS_OWNER', 'ADMIN') NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Restaurants (
    id                  INT PRIMARY KEY AUTO_INCREMENT,
    owner_id            INT NOT NULL,  -- Doanh nhân sở hữu nhà hàng
    name                VARCHAR(255) NOT NULL,
    address             TEXT NOT NULL,
    hotline             VARCHAR(20) NOT NULL,
    description         TEXT,
    menu_image          VARCHAR(255), -- Ảnh menu
    restaurant_image    VARCHAR(255), -- Ảnh nhà hàng
    status              ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Tables (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id  INT NOT NULL,
    table_type     ENUM('2', '4', '6') NOT NULL, -- Chỉ cho phép 2, 4, 6 chỗ
    quantity       INT NOT NULL,  -- Số lượng bàn mỗi loại
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Reservations (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    user_id        INT NOT NULL,
    restaurant_id  INT NOT NULL,
    table_type     ENUM('2', '4', '6') NOT NULL,
    num_tables     INT NOT NULL,  -- Số bàn đặt
    date           DATE NOT NULL,
    time_slot      ENUM('LUNCH', 'DINNER') NOT NULL, -- Đặt theo buổi
    status         ENUM('PENDING', 'CONFIRMED', 'CANCELLED') DEFAULT 'PENDING',
    note           TEXT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Reviews (
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

CREATE TABLE IF NOT EXISTS Promotions (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id  INT NOT NULL,
    title          VARCHAR(255) NOT NULL,
    description    TEXT NOT NULL,
    discount       DECIMAL(5,2) NOT NULL,  -- % giảm giá
    start_date     DATE NOT NULL,
    end_date       DATE NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Messages (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    user_id        INT,
    message        TEXT NOT NULL,
    response       TEXT NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL
);
