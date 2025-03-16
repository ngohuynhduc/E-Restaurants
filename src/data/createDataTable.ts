import pool from '../config/db';

export const createDataTable = async () => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS Users (
        id             INT PRIMARY KEY AUTO_INCREMENT,
        full_name      VARCHAR(255) NOT NULL,
        email          VARCHAR(255) UNIQUE NOT NULL,
        password       VARCHAR(255) NOT NULL,
        phone          VARCHAR(20),
        role           ENUM('USER', 'BUSINESS_OWNER', 'ADMIN') NOT NULL,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS Restaurants (
        id             INT PRIMARY KEY AUTO_INCREMENT,
        owner_id       INT NOT NULL,
        name           VARCHAR(255) NOT NULL,
        address        TEXT NOT NULL,
        hotline        VARCHAR(20) NOT NULL,
        description    TEXT,
        menu_image     JSON,
        restaurant_image    JSON,
        coordinate     POINT,
        status         ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES Users(id) ON DELETE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS Tables (
        id             INT PRIMARY KEY AUTO_INCREMENT,
        restaurant_id  INT NOT NULL,
        table_type     ENUM('2', '4', '6') NOT NULL,
        quantity       INT NOT NULL,
        FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS Reservations (
        id             INT PRIMARY KEY AUTO_INCREMENT,
        user_id        INT NOT NULL,
        restaurant_id  INT NOT NULL,
        table_type     ENUM('2', '4', '6') NOT NULL,
        num_tables     INT NOT NULL,
        date           DATE NOT NULL,
        time_slot      ENUM('LUNCH', 'DINNER') NOT NULL,
        status         ENUM('PENDING', 'CONFIRMED', 'CANCELLED') DEFAULT 'PENDING',
        note           TEXT,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS Reviews (
        id             INT PRIMARY KEY AUTO_INCREMENT,
        user_id        INT NOT NULL,
        restaurant_id  INT NOT NULL,
        rating         ENUM('1', '2', '3', '4', '5') NOT NULL,
        comment        TEXT,
        image          VARCHAR(255),
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS Promotions (
        id             INT PRIMARY KEY AUTO_INCREMENT,
        restaurant_id  INT NOT NULL,
        title          VARCHAR(255) NOT NULL,
        description    TEXT NOT NULL,
        discount       DECIMAL(5,2) NOT NULL,
        start_date     DATE NOT NULL,
        end_date       DATE NOT NULL,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS Messages (
        id             INT PRIMARY KEY AUTO_INCREMENT,
        user_id        INT,
        message        TEXT NOT NULL,
        response       TEXT NOT NULL,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL
    );`,
  ];

  try {
    const conn = await pool.getConnection();
    for (const query of queries) {
      await conn.query(query);
    }
    conn.release();
    console.log('All tables created successfully');
  } catch (err: any) {
    throw new Error(err);
  }
};
