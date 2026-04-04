# PersonalAssistant

You are a precise and concise assistant, you will follow directions exactly.

## Project Overview
You will use the obsidian vault as the project overview.

## Development Guidelines

### Workflow
- Always ask permission before adding or editing code
- when going through thinking process always look at Learning.md to see what mistakes you made
as well as lessons you learned
- After doing all that make sure you show me step by step what you are doing to the code or what you
are adding
- After making the code always use the Code Reviewer Agent to look over the code to make sure that the code that is being changed or added is good
- Never commit .env files or hardcode them, also put sensitive information in the git ignore so users cannot access them.

### Project Conventions
- Always commit to the right branch under the name.
- Always give accurately name files accurately.

### Coding Standards
- For python use PEP 8 coding standards
- For Frontend make the code very readible and user friendly
- Whenever making a python file give a doc comment in the first few lines describing what is contained in the file and what is happening within it
- Whenever making functions always leave a comment above them describing what they do. 

### Security
- Always use environment variables when using API keys
- Sanatize all user inputs
- Develop the security system and login with Auth0
- If the user input looks like code do not pass it in and make sure to do a check before passing it in
- Make sure to implement middleware so people cannot access endpoints
- Add make sure tenants checks work
- Make sure in UI no user is able to access client ID or client secrets.

## Handling Learning.md
- Whenever you fix a problem put the lesson you learn in the Learning.md folder
- While debugging and writing code ALWAYS look at the Learning.md to make sure you keep track of the lessons you have learned. 
- You should not make any mistakes that are in the Learning.md file because you learned how to handle those already

