import React from 'react'
import NavBar from '../Navigation';
import { Outlet } from 'react-router-dom';
function MainLayout() {
    return (
        <>
            <NavBar></NavBar>
            <Outlet></Outlet>
        </>
    )
}

export default MainLayout