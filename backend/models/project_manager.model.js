import { db } from "../db/Connect.js";

const user_status = `CREATE TYPE user_status AS ENUM ('Admin', 'Manager', 'Member');
`;

const User_model = `CREATE TABLE IF NOT EXISTS Users (
	id INT PRIMARY KEY,
	name VARCHAR(50),
	email VARCHAR(50) NOT NULL,
	password VARCHAR (255) NOT NULL,
	created_at DATE DEFAULT CURRENT_DATE,
    role user_status,
    isVerified BOOLEAN DEFAULT FALSE,
    verificationToken TEXT,
    verificationTokenExpiry DATE,
    resetPasswordToken TEXT,
    resetPasswordTokenExpiry DATE
);`;

const project_status = `CREATE TYPE project_status AS ENUM ('Not Started', 'In progress', 'Completed');
`;

const Projects_model = `CREATE TABLE IF NOT EXISTS Projects(
                        id SERIAL PRIMARY KEY,
                        project_name VARCHAR(100) NOT NULL,
                        description TEXT,
                        created_by INTEGER REFERENCES Users(id),
                        created_at DATE DEFAULT CURRENT_DATE,   
                        status project_status                  
);`;

const task_status = `CREATE TYPE task_status AS ENUM ('To Do','In Progress','Completed');`;

const Task_model = `CREATE TABLE IF NOT EXISTS Tasks(
                    id SERIAL PRIMARY KEY,
                    task_title VARCHAR(20) NOT NULL,
                    description TEXT,
                    assigned_to INTEGER REFERENCES Users(id),
                    project_id INTEGER REFERENCES Projects(id),
                    due_date DATE,
                    status task_status
                    );`;

const Comments_model = `CREATE TABLE IF NOT EXISTS Comments(
id SERIAL PRIMARY KEY,
content TEXT NOT NULL,
user_id INTEGER REFERENCES Users(id),
task_id INTEGER REFERENCES Tasks(id),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

export const Create_Tables = async () => {
  try {
    //run user table queries
    await db.query(user_status);
    console.log("User roles ENUM created successfully");
    await db.query(User_model);
    console.log("Users table created successfully");

    //run project table queries
    await db.query(project_status);
    console.log("Project status ENUM created successfully");
    await db.query(Projects_model);
    console.log("Projects table created successfully");

    //runn task table queries
    await db.query(task_status);
    console.log("Task status ENUM created successfully");
    await db.query(Task_model);
    console.log("Tasks table created successfully");

    //run the comments model
    await db.query(Comments_model);
  } catch (error) {
    console.log(`Error creating tables: ${error}`);
  }
};
