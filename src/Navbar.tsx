import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
    },
    menuButton: {
        marginRight: theme.spacing(2),
    },
    title: {
        flexGrow: 1,
    },
}));

interface NavbarProps {
    authenticated : boolean;
    displayName : string;
    initialLoad : boolean;
}

const Navbar = ({authenticated, displayName, initialLoad} : NavbarProps) => {
    const classes = useStyles();

    const onSignInClick = () => {
        window.open(
            process.env.NODE_ENV === "production"
                ? "https://midi-rhythm-tool-server.herokuapp.com/api/auth/google"
                : "http://localhost:8080/api/auth/google",
            "_self"
        );
    };

    const onSignOutClick = () => {
        window.open(
            process.env.NODE_ENV === "production"
                ? "https://midi-rhythm-tool-server.herokuapp.com/api/logout"
                : "http://localhost:8080/api/logout",
            "_self"
        );
    };

    return (
        <div className={classes.root}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" className={classes.title}>
                        MIDI Rhythm Tool
                    </Typography>
                    <Typography style={{ display: "inline-block", paddingRight: "2em" }}>{displayName}</Typography>
                    {authenticated === false ? (
                        <Button color="inherit" onClick={() => onSignInClick()} disabled={!initialLoad}>
                            Login
                        </Button>
                    ) : (
                        <div>
                            <Button color="inherit" onClick={() => onSignOutClick()} disabled={!initialLoad}>
                                Logout
                            </Button>
                        </div>
                    )}
                </Toolbar>
            </AppBar>
        </div>
    );
};

export { Navbar };
