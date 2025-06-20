import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import MDEditor from "@uiw/react-md-editor";
import hljs from 'highlight.js';
import { getWebContainer } from '../config/webcontainer'


function SyntaxHighlightedCode(props) {
    const ref = useRef(null)

    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-') && window.hljs) {
            window.hljs.highlightElement(ref.current)

            // hljs won't reprocess the element unless this attribute is removed
            ref.current.removeAttribute('data-highlighted')
        }
    }, [props.className, props.children])

    return <code {...props} ref={ref} />
}


const Project = () => {

    const location = useLocation()
    const navigate = useNavigate();
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState(new Set()) // Initialized as Set
    const [project, setProject] = useState(location.state.project)
    const [message, setMessage] = useState('')
    const { user } = useContext(UserContext)
    const messageBox = React.createRef()

    const [users, setUsers] = useState([])
    const [messages, setMessages] = useState([]) // New state variable for messages
    const [fileTree, setFileTree] = useState({})

    const [currentFile, setCurrentFile] = useState(null)
    const [openFiles, setOpenFiles] = useState([])

    const [webContainer, setWebContainer] = useState(null)
    const [iframeUrl, setIframeUrl] = useState(null)

    const [runProcess, setRunProcess] = useState(null)

    const handleUserClick = (id) => {
        setSelectedUserId((prevSelectedUserId) => {
            const newSelectedUserId = new Set(prevSelectedUserId);
            if (newSelectedUserId.has(id)) {
                newSelectedUserId.delete(id);
            } else {
                newSelectedUserId.add(id);
            }
            return newSelectedUserId;
        });
    };

    const addCollaborators = async () => {
        try {
            const res = await axios.put("/projects/add-user", {
                projectId: location.state.project._id,
                users: Array.from(selectedUserId),
            });
            console.log(res.data);
            setIsModalOpen(false);
        } catch (err) {
            console.error(err);
        }
    };

    const send = () => {
        sendMessage("project-message", {
            message,
            sender: user,
        });

        setMessages((prevMessages) => [...prevMessages, { sender: user, message }]);
        setMessage("");
    };


    function WriteAiMessage(message) {
        let messageObject;
        try {
            messageObject = JSON.parse(message);
        } catch (e) {
            return <p className="text-red-600">Invalid AI message format</p>;
        }

        return (
            <div
                className="bg-black text-white py-1 rounded-md overflow-auto text-sm"
            >
                <MDEditor.Markdown
                    source={messageObject.text}
                    style={{
                        backgroundColor: "transparent",
                        color: "white",
                    }}
                />
            </div>
        );
    }


    useEffect(() => {
        if (!location.state?.project?._id) return;
        const { _id: projectId } = location.state.project;
        let active = true;

        initializeSocket(projectId);

        if (!webContainer) {
            getWebContainer().then((container) => {
                if (active) {
                    setWebContainer(container);
                    console.log("container started");
                }
            });
        }

        receiveMessage("project-message", (data) => {
            if (!active) return;
            console.log(data);

            if (data.sender._id === "ai") {
                try {
                    const message = JSON.parse(data.message);
                    console.log(message);

                    if (message.fileTree) {
                        setFileTree(message.fileTree);
                        webContainer?.mount(message.fileTree);
                    }
                } catch (e) {
                    console.error("Invalid AI message", e);
                }
            }

            setMessages((prevMessages) => [...prevMessages, data]);
        });

        const fetchProjectAndUsers = async () => {
            try {
                const projectRes = await axios.get(`/projects/get-project/${projectId}`);
                console.log(projectRes.data.project);
                setProject(projectRes.data.project);
                setFileTree(projectRes.data.project.fileTree || {});

                const usersRes = await axios.get("/users/all");
                setUsers(usersRes.data.users);
            } catch (err) {
                console.error("Error fetching data", err);
            }
        };

        fetchProjectAndUsers();

        return () => {
            active = false;
        };
    }, []);

    const saveFileTree = async (ft) => {
        try {
            const res = await axios.put("/projects/update-file-tree", {
                projectId: project._id,
                fileTree: ft,
            });
            console.log(res.data);
        } catch (err) {
            console.error(err);
        }
    };


    function scrollToBottom() {
        messageBox.current.scrollTop = messageBox.current.scrollHeight
    }

    return (
        <main className='h-screen w-screen flex bg-gradient-to-br from-indigo-50 via-white to-indigo-100'>
            <section className="left relative flex flex-col h-screen min-w-96 bg-white border-r border-gray-200 shadow-md">
                <header className='flex justify-between items-center p-2 px-4 w-full bg-indigo-100 absolute z-10 top-0 border-b border-indigo-200'>
                    <i class="p-2 font-medium ri-arrow-left-line text-indigo-700 scale-110 hover:scale-[125%] transition" onClick={() => navigate("/home")}></i>
                    <div className='flex flex-row gap-6'>
                        <button className='text-indigo-700 scale-110 hover:scale-[125%] transition' onClick={() => setIsModalOpen(true)}>
                            <i className="ri-add-fill"></i>
                        </button>
                        <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className=' text-indigo-700 hover:scale-[125%] transition'>
                            <i className="ri-group-fill"></i>
                        </button>
                    </div>
                </header>

                <div className="conversation-area pt-14 pb-10 flex-grow flex flex-col h-full relative">
                    <div ref={messageBox} className="message-box p-3 flex-grow flex flex-col gap-2 overflow-auto max-h-full">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`${msg.sender._id === 'ai' ? 'max-w-80 bg-black' : 'max-w-52 bg-indigo-50'} ${msg.sender._id === user._id.toString() ? 'ml-auto' : ''} message flex flex-col p-3 rounded-xl shadow-sm`}
                            >
                                <small className={`${msg.sender._id === 'ai' ? 'text-white' : 'text-gray-600 opacity-65'} text-xs overflow-hidden text-ellipsis`}>
                                    {msg.sender.email}
                                </small>
                                <div className='text-sm text-gray-800'>
                                    {msg.sender._id === 'ai' ? WriteAiMessage(msg.message) : <p>{msg.message}</p>}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="inputField w-full flex absolute bottom-0 border-t border-indigo-200 bg-white">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    send();
                                }
                            }}
                            className='p-3 px-4 flex-grow border-none outline-none text-gray-800'
                            type="text"
                            placeholder='Enter message'
                        />
                        <button onClick={send} className='px-5 bg-indigo-700 text-white'>
                            <i className="ri-send-plane-fill"></i>
                        </button>
                    </div>
                </div>

                <div className={`sidePanel w-full h-full flex flex-col gap-2 bg-indigo-50 absolute transition-all ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'} top-0 z-20`}>
                    <header className='flex justify-between items-center px-4 p-2 bg-indigo-100 border-b border-indigo-200'>
                        <h1 className='font-semibold text-lg text-indigo-700'>Collaborators</h1>
                        <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2 text-indigo-700'>
                            <i className="ri-close-fill"></i>
                        </button>
                    </header>
                    <div className="users flex flex-col gap-2 p-2 overflow-auto">
                        {project.users && project.users.map(user => (
                            <div key={user._id} className="user cursor-pointer hover:bg-indigo-100 p-2 flex gap-2 items-center rounded-md">
                                <div className='aspect-square rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-indigo-400'>
                                    <i className="ri-user-fill absolute"></i>
                                </div>
                                <h1 className='font-medium text-indigo-800'>{user.email}</h1>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="right flex-grow h-full flex">
                <div className="explorer h-full max-w-64 min-w-52 bg-white border-r border-gray-200 shadow-sm">
                    <div className="file-tree w-full">
                        {Object.keys(fileTree).map((file, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setCurrentFile(file)
                                    setOpenFiles([...new Set([...openFiles, file])])
                                }}
                                className="tree-element cursor-pointer p-3 px-4 flex items-center gap-2 hover:bg-indigo-100 w-full text-indigo-800 font-medium"
                            >
                                {file}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="code-editor flex flex-col flex-grow h-full">
                    <div className="top flex justify-between w-full bg-indigo-100 p-2 border-b border-indigo-200">
                        <div className="files flex">
                            {openFiles.map((file, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentFile(file)}
                                    className={`open-file cursor-pointer p-2 px-4 ${currentFile === file ? 'bg-indigo-200' : 'bg-white'} text-indigo-800 font-medium border-r border-indigo-300`}
                                >
                                    {file}
                                </button>
                            ))}
                        </div>
                        <div className="actions flex gap-2">
                            <button
                                onClick={async () => {
                                    await webContainer.mount(fileTree);
                                    const installProcess = await webContainer.spawn("npm", ["install"]);
                                    installProcess.output.pipeTo(new WritableStream({
                                        write(chunk) {
                                            console.log(chunk);
                                        }
                                    }));
                                    if (runProcess) runProcess.kill();
                                    const tempRunProcess = await webContainer.spawn("npm", ["start"]);
                                    tempRunProcess.output.pipeTo(new WritableStream({
                                        write(chunk) {
                                            console.log(chunk);
                                        }
                                    }));
                                    setRunProcess(tempRunProcess);
                                    webContainer.on('server-ready', (port, url) => {
                                        console.log(port, url);
                                        setIframeUrl(url);
                                    });
                                }}
                                className='px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700'
                            >
                                Run
                            </button>
                        </div>
                    </div>

                    <div className="bottom flex-grow overflow-auto bg-white">
                        {fileTree[currentFile] && (
                            <div className="code-editor-area h-full overflow-auto flex-grow p-4">
                                <pre className="hljs h-full">
                                    <code
                                        className="hljs h-full outline-none"
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                            const updatedContent = e.target.innerText;
                                            const ft = {
                                                ...fileTree,
                                                [currentFile]: {
                                                    file: {
                                                        contents: updatedContent,
                                                    },
                                                },
                                            };
                                            setFileTree(ft);
                                            saveFileTree(ft);
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: hljs.highlight('javascript', fileTree[currentFile].file.contents).value,
                                        }}
                                        style={{ whiteSpace: 'pre-wrap', paddingBottom: '25rem', counterSet: 'line-numbering' }}
                                    />
                                </pre>
                            </div>
                        )}
                    </div>
                </div>

                {iframeUrl && webContainer && (
                    <div className="flex min-w-96 flex-col h-full border-l border-gray-200">
                        <div className="address-bar p-2 bg-indigo-50 border-b border-indigo-200">
                            <input
                                type="text"
                                onChange={(e) => setIframeUrl(e.target.value)}
                                value={iframeUrl}
                                className="w-full p-2 px-4 bg-white border border-indigo-300 rounded-md text-sm"
                            />
                        </div>
                        <iframe src={iframeUrl} className="w-full h-full"></iframe>
                    </div>
                )}
            </section>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-96 max-w-full relative">
                        <header className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-semibold text-indigo-700'>Select User</h2>
                            <button onClick={() => setIsModalOpen(false)} className='p-2 text-indigo-700'>
                                <i className="ri-close-fill"></i>
                            </button>
                        </header>
                        <div className="users-list flex flex-col gap-2 max-h-96 overflow-auto mb-16">
                            {users.map(user => (
                                <div
                                    key={user.id}
                                    className={`user cursor-pointer hover:bg-indigo-100 ${Array.from(selectedUserId).includes(user._id) ? 'bg-indigo-100' : ''} p-2 flex gap-2 items-center rounded-md`}
                                    onClick={() => handleUserClick(user._id)}
                                >
                                    <div className='aspect-square relative rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-indigo-500'>
                                        <i className="ri-user-fill absolute"></i>
                                    </div>
                                    <h1 className='font-medium text-indigo-800'>{user.email}</h1>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addCollaborators}
                            className='absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700'
                        >
                            Add Collaborators
                        </button>
                    </div>
                </div>
            )}
        </main>

    )
}

export default Project