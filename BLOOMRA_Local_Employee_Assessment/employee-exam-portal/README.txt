BLOOMRA EMPLOYEE ASSESSMENT PORTAL - LOCAL VERSION

FILES
- index.html: website page
- style.css: design
- app.js: login, exam, scoring, local results and admin dashboard
- data/questions.js: 12 department exams (10 questions each) from the supplied assessment PDF

HOW TO RUN
1. Extract the ZIP file.
2. Open the extracted employee-exam-portal folder in Visual Studio Code.
3. Install the Live Server extension (Ritwick Dey), if not already installed.
4. Right-click index.html and choose Open with Live Server.

LOGIN
Employee username format: Employee Name - Department
Example: Rahul - Marketing & Sales
Employee password: 123
Admin username: bloomara
Admin password: 000

IMPORTANT LOCAL-ONLY LIMITATIONS
- This version has no database or server.
- Results are saved in localStorage in the browser where the exam was taken.
- Admin can see only results saved in that same browser profile on that same computer.
- Clearing browser site data can delete results and attempt records.
- This is a demonstration/internal local version, not secure authentication. Passwords, questions and answer keys can be inspected in the source files.
- The one-attempt rule is enforced per normalized employee name + department in this browser. It can be bypassed by clearing local browser data or using another browser/device.
- Export CSV in Admin saves a copy of the currently recorded results.
