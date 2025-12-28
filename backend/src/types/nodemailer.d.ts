// Type declaration for nodemailer (workaround for missing @types/nodemailer)
declare module 'nodemailer' {
    export function createTransporter(options: any): any;
    const nodemailer: any;
    export default nodemailer;
}
