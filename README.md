
# New-Flow Salon Website
  ![license badge](https://img.shields.io/badge/license-MIT-blue)
## Table of Contents
* [Description](#description)
* [License](#license)
* [Installation](#installation)
* [Usage](#usage)
* [Contributions](#contributions)
* [Contact Information](#contact-information)
* [Delployed Website](#deployed-website)
* [Additional Notes](#additional-notes)

## Description
New Flow, is proud to be a Latino-owned barbershop and beauty salon rooted in the heart of our community. Since opening our doors in 2009, our mission has been to blend tradition, culture, and creativity to bring out the best in everyone who walks through our doors. This is the main webpage for the business were the user can find shop information and schdule an appointment.

## License
This project is licensed with MIT

## Installation 
npm install

## Usage
### Pages
* [Home](#home)
* [About](#about)
* [Appointments](#appointments)
* [Log In](#log-in)
* [Sign Up](#sign-up)


### Home
From New Flow home page the user can select from the menu of page options, Home, About, Appointments, Login, and Sign Up

![NewFlow Main Page Top](/client/src/assets/images/NewFlowMainPage.png)

Access the Intagram page by clicking on the icon 

![Insta Access](/client/src/assets/images/NewFlowInsta.png)

And you can change the language of the webpage between Spanish and English at the bottom of the page 

![Language Button](/client/src/assets/images/NewFlowLanguageButton.png)

### About 
The About pages includes location information using an embedded Goodle Map, it also includes the salons mission statement and story.

![About Page](/client/src/assets/images/NewFlowAbout.png)

### Appointments
To Make an appointment with the salon online, click the button to log into the Calendly calender magament service. 

![Appointments Page](./client/src/assets/images/NewFlowLoginwithCalendly.png)

Once logged in, a Web API will display the appointments types available. Select Your appointment type. 

![Appointment Types](./client/src/assets/images/NewFlowAPIEventsCall.png)

Next you will be directed to Calendly on a new tab to select from the available times on the Salons Calender. 

![Book Appoontment](./client/src/assets/images/NewFlowCalendlyAvailableTimes.png)


### Log In
Ths log in page is something we are going to implement in the future, by using our autheticated sign in method to allow employees to post announcements on the main page. 

![LogIn Page](/client/src/assets/images/NewFlowLogin.png)

### Sign Up
The sign up page is our first step toward and employee login creation. Eventually this would be on a different pages entirely so that employee could eventually sign up, be authenticated and then be permitted to make posts on the main page for clients to see. The information that is inputted into the sign up is saved to our salon_db.Assess the database using postgres. 

![Sign Up Page](/client/src/assets/images/NewFlowSignUp.png)

Database 

![Database Using Postgres](/client/src/assets/images/NewFlowDataBase.png)

## Contributions
Michael Mosquera, Khadijih Garcia, and Erin Jacobsen

Github Repository Location: [GitHub Link](https://github.com/achensen/New-Flow.git)
 
## Contact Information
* Michael Mosquera - My [GitHub Account Link](https://github.com/Mimosquera)
* Khadijih Garcia - My [GitHub Account Link](https://github.com/KhadijihG)
* Erin Jacobsen - My  [GitHub Account Link](https://github.com/achensen)

## Delployed Website
Please follow this link for The New Flow Website : [Deployed Website](https://new-flow-916d.onrender.com)

## Additional Notes 
We worked together on this code and to deploy this site using many different resources. We used Calendly documentation as well as suggestions from Open AI to implement the web apis. We also utilized tutoring to help bring peices of this code together. This is project 2 for our EDX course. 
