@echo off
heroku run "npx sequelize-cli db:migrate --config server/config/config.cjs" --app new-flow-barbershop
