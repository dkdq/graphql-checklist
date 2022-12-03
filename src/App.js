import { useQuery, gql, useMutation } from '@apollo/client';
import { useState } from 'react';

const GET_TODOS = gql`
    query getTodos {
        todos {
            id
            text
            done
        }
    }
`;

const TOGGLE_TODO = gql`
    mutation toggleTodo($id: uuid!, $done: Boolean!) {
        update_todos(where: {id: {_eq: $id}}, _set: {done: $done}) {
            returning {
                done
                id
                text
            }
        }
    }  
`

const ADD_TODO = gql`
    mutation addTodo($text: String!) {
        insert_todos(objects: {text: $text}) {
            returning {
                done
                id
                text
            }
        }
    }
`

const DELETE_TODO = gql`
    mutation deleteTodo($id: uuid!) {
        delete_todos(where: {id: {_eq: $id}}) {
            returning {
                done
                id
                text
            }
        }
    }
`

function App() {
    const [todoText, setTodoText] = useState('');
    const { loading, error, data } = useQuery(GET_TODOS);
    const [toggleTodo] = useMutation(TOGGLE_TODO);
    const [addTodo] = useMutation(ADD_TODO, { onCompleted: () => setTodoText('') });
    const [deleteTodo] = useMutation(DELETE_TODO);

    async function handleToggleTodo(todo) {
        const data = await toggleTodo({ variables: { id: todo.id, done: !todo.done } })
        console.log('toggle todo', data)
    }

    async function handleAddTodo(event) {
        event.preventDefault();
        if (!todoText.trim()) return;
        const data = await addTodo({ variables: { text: todoText }, refetchQueries: [{ query: GET_TODOS }]})
        // setTodoText('')
        console.log('add todo', data)
    }

    async function handleDeleteTodo(todo) {
        const isConfirmed = window.confirm('Do you want to delete this todo?')
        if (isConfirmed) {
            await deleteTodo({
                variables: { id: todo.id },
                update: cache => {
                    const prevData = cache.readQuery({ query: GET_TODOS })
                    const newTodos = prevData.todos.filter(item => item.id !== todo.id)
                    cache.writeQuery({ query: GET_TODOS, data: { todos: newTodos }})
                }
            })
        }
    }

    if (loading) return <p>Loading...</p>
    if (error) return <p>Error : {error.message}</p>

    return (
        <div className='vh-100 code flex flex-column items-center bg-purple white pa3 fl-l'>
            <h1 className='f2-l'>Graphql Checklist{' '}<span role="img">✅</span></h1>
            <form className='mb3' onSubmit={handleAddTodo}>
                <input className='pa4 f4 b--dashed bw3' onChange={event => setTodoText(event.target.value)} value={todoText} type="text" placeholder='Write your todo..' />
                <button className='pa4 f4 bg-green white' type='submit'>Create</button>
            </form>
            <div className='flex items-center justify-center flex-column'>
                {data.todos.map(todo => (
                    <p key={todo.id}>
                        <span className={`pointer list pa1 f3 ${todo.done && 'strike'}`} onClick={() => handleToggleTodo(todo)}>
                            {todo.text}
                        </span>
                        <button className='bg-transparent white f4' onClick={() => handleDeleteTodo(todo)}>&times;</button>
                    </p>
                ))}
            </div>
        </div>
    )
}

export default App;
