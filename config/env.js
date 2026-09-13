import env from 'dotenv'
const mode = process.env.DEVELOPMENT

let envFile;
if(mode){
    envFile = ".env.development"
}else{
    envFile = ".env"
}

env.config({path:envFile})

