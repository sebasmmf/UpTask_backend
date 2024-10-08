import type { Request, Response } from "express"
import User from "../models/User"
import { checkPassword, hashPassword } from "../utils/auth"
import Token from "../models/Token"
import { generateToken } from "../utils/token"
import { AuthEmail } from "../emails/AuthEmail"
import { generateJWT } from "../utils/jwt"


export class AuthController {

    static createAccount = async (req : Request, res : Response) => {
        try {
            const { password, email } = req.body

            // Prevenir duplicado
            const userExists = await User.findOne({email})
            if (userExists) {
                const error = new Error('El usuario ya está registrado')
                return res.status(409).json({error: error.message})
            }

            // Crea un usuario
            const user = new User(req.body)

            // Hash Password
            user.password = await hashPassword(password)

            const token = new Token()
            token.token = generateToken()
            token.user = user.id

            // Enviar Email
            AuthEmail.sendConfirmationEmail({
                email: user.email,
                name: user.name,
                token: token.token
            })

            await Promise.allSettled([user.save(), token.save()])
            res.send('Cuenta creada, revisa tu email para confirmarla') 
        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static confirmAccount = async (req : Request, res : Response) => {
        try {
            const { token } = req.body

            const tokenExist = await Token.findOne({token})

            if (!tokenExist) {
                const error = new Error('Token no válido')
                return res.status(404).json({error: error.message})
            }

            const user = await User.findById(tokenExist.user)
            user.confirmed = true

            await Promise.allSettled([user.save(), tokenExist.deleteOne()])
            res.send('Cuenta confirmada correctamente')
        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static login = async (req : Request, res : Response) => {
        try {
            const { email, password } = req.body

            const user = await User.findOne({email})

            if (!user) {
                const error = new Error('Usuario no encontrado')
                return res.status(404).json({error: error.message})
            }

            if (!user.confirmed) {

                const previousToken = await Token.findOne({user: user.id})

                if (previousToken) {
                    await previousToken.deleteOne()
                }

                const token = new Token()
                token.user = user.id
                token.token = generateToken()
                await token.save()

                // Enviar Email
                AuthEmail.sendConfirmationEmail({
                    email: user.email,
                    name: user.name,
                    token: token.token
                })
                
                const error = new Error('La cuenta no ha sido confirmada, hemos enviado un e-mail de confirmación')
                return res.status(401).json({error: error.message})
            }

            // Revisar password
            const isPasswordCorrect = await checkPassword(password, user.password)

            if (!isPasswordCorrect) {
                const error = new Error('Password incorrecto')
                return res.status(404).json({error: error.message})
            }

            const token = generateJWT({id: user.id})

            res.send(token)
        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static requestConfirmationCode = async (req : Request, res : Response) => {
        try {
            const { email } = req.body

            // Usuario existe
            const user = await User.findOne({email})
            if (!user) {
                const error = new Error('El usuario no está registrado')
                return res.status(404).json({error: error.message})
            }

            if (user.confirmed) {
                const error = new Error('El usuario ya está confirmado')
                return res.status(403).json({error: error.message})
            }

            const previousToken = await Token.findOne({user: user.id})

            if (previousToken) {
                await previousToken.deleteOne()
            }

            const token = new Token()
            token.token = generateToken()
            token.user = user.id

            // Enviar Email
            AuthEmail.sendConfirmationEmail({
                email: user.email,
                name: user.name,
                token: token.token
            })

            await token.save()
            res.send('Se envió un nuevo token a tu e-mail') 
        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static forgotPassword = async (req : Request, res : Response) => {
        try {
            const { email } = req.body

            // Usuario existe
            const user = await User.findOne({email})
            if (!user) {
                const error = new Error('El usuario no está registrado')
                return res.status(404).json({error: error.message})
            }

            const previousToken = await Token.findOne({user: user.id})

            if (previousToken) {
                await previousToken.deleteOne()
            }

            const token = new Token()
            token.token = generateToken()
            token.user = user.id
            await token.save()

            // Enviar Email
            AuthEmail.sendPasswordResetToken({
                email: user.email,
                name: user.name,
                token: token.token
            })

            res.send('Revisa tu email para instrucciones')
        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static validateToken = async (req : Request, res : Response) => {
        try {
            const { token } = req.body

            const tokenExist = await Token.findOne({token})

            if (!tokenExist) {
                const error = new Error('Token no válido')
                return res.status(404).json({error: error.message})
            }

            res.send('Token válido, Define tu nuevo password')
        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static updatePasswordWithToken = async (req : Request, res : Response) => {
        try {
            const { token } = req.params
            const { password } = req.body

            const tokenExists = await Token.findOne({token})
            if (!tokenExists) {
                const error = new Error('Token no válido')
                return res.status(404).json({error: error.message})
            }

            const user = await User.findById(tokenExists.user)
            user.password = await hashPassword(password)

            await Promise.allSettled([user.save(), tokenExists.deleteOne()])

            res.send('El password se modificó correctamente')
        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static user = async (req : Request, res : Response) => {
        return res.json(req.user)
    }

    static updateProfile = async (req : Request, res : Response) => {
        const { name, email } = req.body

        const userExist = await User.findOne({email})
        if (userExist && userExist.id.toString() !== req.user.id.toString()) {
            const error = new Error('Ese email ya está registrado')
            return res.status(409).json({error: error.message})

        }

        req.user.name = name
        req.user.email = email

        try {
            await req.user.save()
            res.send('Perfil actualizado correctamente')
        } catch (error) {
            res.status(500).send('Hubo un error')
        }
    }

    static updateCurrentUserPassword = async (req : Request, res : Response) => {
        const { current_password, password } = req.body

        const user = await User.findById(req.user.id)

        const isPasswordCorrect = await checkPassword(current_password, user.password)
        if (!isPasswordCorrect) {
            const error = new Error('El Password actual es incorrecto')
            return res.status(401).json({error: error.message})
        }

        try {
            user.password = await hashPassword(password)
            await user.save()
            res.send('El password se modificó correctamente')
        } catch (error) {
            res.status(500).send('Hubo un error')
        }
    }

    static checkPassword = async (req : Request, res : Response) => {
        const { password } = req.body

        const user = await User.findById(req.user.id)

        const isPasswordCorrect = await checkPassword(password, user.password)
        if (!isPasswordCorrect) {
            const error = new Error('El Password es incorrecto')
            return res.status(401).json({error: error.message})
        }
        
        res.send('Password Correcto')
    }
}