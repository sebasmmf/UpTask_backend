import { transporter } from "../config/nodemailer"

interface IEmail {
    email: string,
    name: string,
    token: string
}

export class AuthEmail {
    static sendConfirmationEmail = async (user : IEmail) => {   
        const info = await transporter.sendMail({
            from: 'UpTask <admin@uptask.com>',
            to: user.email,
            subject: 'UpTask - Confirma tu cuenta',
            text: 'UpTask - Confirma tu cuenta',
            html: `
                <p>Hola: ${user.name}, haz creado tu cuenta en UpTask, ya casi está todo listo, solo debes confirmar tu cuenta.</p>
                <p>Visita el siguiente enlace:</p>
                <a href="${process.env.FRONTEND_URL}/auth/confirm-account">Confirmar Cuenta</a>
                <p>E ingresa el código: <b>${user.token}</b></p>
                <p>Este token expira en 10 minutos</p>
            `
        })
    }

    static sendPasswordResetToken = async (user : IEmail) => {   
        const info = await transporter.sendMail({
            from: 'UpTask <admin@uptask.com>',
            to: user.email,
            subject: 'UpTask - Reestablece tu password',
            text: 'UpTask - Reestablece tu password',
            html: `
                <p>Hola: ${user.name}, haz solicitado reestablecer tu password.</p>
                <p>Visita el siguiente enlace:</p>
                <a href="${process.env.FRONTEND_URL}/auth/new-password">Reestablecer Password</a>
                <p>E ingresa el código: <b>${user.token}</b></p>
                <p>Este token expira en 10 minutos</p>
            `
        })
    }
}