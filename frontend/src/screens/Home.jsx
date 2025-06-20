import React, { useContext, useState, useEffect } from 'react'
import { UserContext } from '../context/user.context'
import axios from "../config/axios"
import { useNavigate } from 'react-router-dom'

const Home = () => {

    const { user } = useContext(UserContext)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [projectName, setProjectName] = useState('')
    const [project, setProject] = useState([])
    const { setUser } = useContext(UserContext)

    const navigate = useNavigate()

    function createProject(e) {
        e.preventDefault()
        console.log({ projectName })
        axios.post('/projects/create', { name: projectName })
            .then((res) => {
                console.log(res);
                setIsModalOpen(false);
                setProjectName('');
                return axios.get('/projects/all');
            })
            .then(res => {
                setProject(res.data.projects);
            })
            .catch((error) => {
                console.log(error);
            });

    }

    const handleSignOut = async () => {
        try {
            await axios.get('/users/logout');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            navigate('/root');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };



    useEffect(() => {
        if (!user) return;
        axios.get('/projects/all')
            .then((res) => {
                setProject(res.data.projects);
            })
            .catch(err => {
                console.log(err);
            });

    }, [user]);


    return (
        <main className="p-6 bg-gradient-to-br from-indigo-50 via-white to-indigo-100 min-h-screen">
            <div className="flex justify-between mb-4">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="project flex items-center justify-center px-4 py-2 border border-indigo-300 text-indigo-700 font-medium bg-white rounded-xl hover:bg-indigo-50 transition min-w-52 shadow-sm"
                >
                    + New Project
                    <i className="ri-link ml-2"></i>
                </button>
                <button
                    onClick={handleSignOut}
                    className="px-4 py-2 bg-red-500 text-white rounded-md font-medium shadow hover:bg-red-600 transition"
                >
                    Sign Out
                </button>
            </div>
            <div className="projects flex flex-wrap gap-4">

                {project.map((project) => (
                    <div
                        key={project._id}
                        onClick={() => {
                            navigate(`/project`, {
                                state: { project },
                            });
                        }}
                        className="project flex flex-col gap-2 cursor-pointer p-4 border border-gray-200 bg-white rounded-xl shadow hover:shadow-md hover:bg-indigo-50 transition min-w-52"
                    >
                        <h2 className="font-semibold text-indigo-700 truncate">{project.name}</h2>

                        <div className="flex gap-2 items-center text-sm text-gray-600">
                            <i className="ri-user-line"></i>
                            <p>
                                <small>Collaborators:</small> {project.users.length}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                        <h2 className="text-2xl font-bold text-indigo-700 mb-4">Create New Project</h2>
                        <form onSubmit={createProject}>
                            <div className="mb-5">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                                <input
                                    type="text"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    className="w-full px-4 py-2 rounded-md border border-gray-300 bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    placeholder="My new project"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    className="px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-md transition"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>

    )
}

export default Home