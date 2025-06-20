import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from '../config/axios'
import { UserContext } from '../context/user.context'

const Login = () => {


    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const { setUser } = useContext(UserContext)

    const navigate = useNavigate()

    function submitHandler(e) {

        e.preventDefault()

        axios.post('/users/login', {
            email,
            password
        }).then((res) => {
            console.log(res.data)
            localStorage.setItem('token', res.data.token)
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setUser(res.data.user)
            navigate('/home')
        }).catch((err) => {
            console.log(err.response.data)
        })
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-indigo-200 px-4">
            <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                <h2 className="text-3xl font-bold text-indigo-700 mb-6 text-center">Welcome back</h2>
                <form onSubmit={submitHandler}>
                    <div className="mb-5">
                        <label htmlFor="email" className="block text-sm text-gray-600 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            placeholder="you@example.com"
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-gray-100 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="password" className="block text-sm text-gray-600 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            placeholder="••••••••"
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-gray-100 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition duration-200 shadow-md"
                    >
                        Login
                    </button>
                </form>

                <p className="text-sm text-gray-500 mt-6 text-center">
                    Don’t have an account?{" "}
                    <Link to="/register" className="text-indigo-600 hover:underline font-medium">
                        Create one
                    </Link>
                </p>
            </div>
        </div>

    )
}

export default Login