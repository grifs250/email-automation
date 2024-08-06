# EMAIL-COLLECTOR
#### Video Demo:  <URL [HERE](https://youtu.be/vRUsLwkpRC8)>
#### Description: This project is a comprehensive web application designed to manage user registrations for a training program. Users can submit their details through a user-friendly form, which the application validates, stores in a MongoDB database, and uses to send a confirmation email. The application leverages Node.js and Express for server-side operations, EJS for templating, and Mongoose for MongoDB interactions, ensuring a robust and efficient solution.

## Project Structure

### app.js

The `app.js` file is the core of the application. It sets up the Express application and handles the initial configuration, including connecting to MongoDB using Mongoose. Middleware for security (Helmet), logging (Morgan), and body parsing are configured here. It also sets the view engine to EJS and includes a rate limiter to prevent abuse, ensuring the application runs smoothly and securely.

### routes/route.js

This file defines the routes for the application. It includes:

- **GET /**: Renders the home page with a registration form.
- **POST /submit**: Handles form submissions, validates and sanitizes input using `express-validator`, saves the data to MongoDB, and sends a confirmation email.
- **GET /thank-you**: Renders the thank-you page, confirming successful registration.

### controller/appController.js

The `appController.js` file contains the route handlers for the application. Functions in this file include:

- **renderHomePage**: Renders the home page with the registration form.
- **handleFormSubmission**: Validates user input, saves the data to MongoDB, and sends a confirmation email using Nodemailer.
- **renderThankYouPage**: Renders the thank-you page upon successful form submission.

### models/email.js

The `email.js` file defines the Mongoose schema for storing email information in MongoDB. The schema includes fields for the user's name and email address, with validation rules to ensure data integrity. This schema ensures that all stored data meets the required format and standards.

### public/css/styles.css

This file contains the CSS styles for the application, ensuring a consistent and appealing look across all pages. It includes styles for layout, typography, forms, and responsiveness, enhancing the user experience on both desktop and mobile devices.

### views/index.ejs

The `index.ejs` file is the main view template for the home page. It includes a form where users can enter their name and email address. The form is designed to be user-friendly and accessible, encouraging users to register for the training program.

### views/tnx.ejs

The `tnx.ejs` file is the view template for the thank-you page. This page is displayed after a user successfully submits the registration form, providing confirmation that their details have been received and processed.

### views/mail.ejs

The `mail.ejs` file is the HTML template for the confirmation email sent to users upon successful registration. It includes placeholders for the user's name, ensuring a personalized and professional communication.

## Features

### User Registration

Users can easily register for the training program by entering their name and email address into a form on the home page. The application ensures that this process is straightforward and secure.

### Input Validation

The application validates user input to ensure it meets the required criteria. This is done using `express-validator`, which checks for valid email formats and non-empty names, preventing invalid data from being stored in the database.

### Data Storage

User data is securely stored in a MongoDB database. The Mongoose schema defined in `models/email.js` ensures that all data stored meets the required format and standards, maintaining data integrity and consistency.

### Email Confirmation

A confirmation email is sent to the user upon successful registration. This email confirms that their details have been received and provides additional information about the training program. Nodemailer is used to send these emails, ensuring reliable and efficient email delivery.

### Rate Limiting

To prevent abuse and ensure the application can handle a large number of requests, rate limiting is implemented. This helps maintain the application's performance and security, especially during periods of high traffic.

## Technologies Used

### Node.js

Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine. It allows for the development of scalable and efficient server-side applications, making it an ideal choice for this project.

### Express

Express is a fast, unopinionated, and minimalist web framework for Node.js. It simplifies the development of server-side applications and provides robust features for web and mobile applications.

### MongoDB

MongoDB is a NoSQL database that offers flexibility and scalability. It stores data in JSON-like documents, making it easy to work with and ideal for handling user registration data.

### Mongoose

Mongoose is an Object Data Modeling (ODM) library for MongoDB and Node.js. It provides a straightforward, schema-based solution to model application data, ensuring data integrity and consistency.

### EJS

EJS (Embedded JavaScript) is a templating engine that allows you to generate HTML markup with plain JavaScript. It is used to render dynamic web pages in the application.

### Nodemailer

Nodemailer is a module for Node.js applications to easily send emails. It is used in this project to send confirmation emails to users upon successful registration.

### express-validator

express-validator is a set of Express.js middlewares that wraps validator.js, a library for string validators and sanitizers. It is used to validate and sanitize user input.

### Helmet

Helmet helps secure Express applications by setting various HTTP headers. It helps protect the application from common web vulnerabilities.

### Morgan

Morgan is an HTTP request logger middleware for Node.js. It is used to log requests to the application, helping with debugging and monitoring.

## Conclusion

This project exemplifies how to build a robust and secure web application using modern web technologies. By incorporating features such as user registration, input validation, data storage, email confirmation, and rate limiting, it provides a comprehensive solution for managing training program registrations. The clean project structure and modular code make it easy to understand, extend, and maintain.


