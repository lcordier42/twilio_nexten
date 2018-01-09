import React, { Component } from "react";

class NameBox extends Component {
    render() {
        const name = this.props.name;
        const onNameChanged = this.props.onNameChanged;
        const logIn = this.props.logIn;
        const onStatusChanged = this.props.onStatusChanged.bind(this);
        const status = this.props.status;
        return (
            <div>
                <form onSubmit={logIn}>
                    <label htmlFor="name">Name: </label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        onChange={onNameChanged}
                        value={name}
                    />
                    <br />
                    <label htmlFor="status">Status: </label>
                    <select
                        name="status"
                        id="status"
                        onChange={onStatusChanged}
                        value={status}
                    >
                        <option value=""></option>
                        <option value="business">business</option>
                        <option value="candidat">candidat</option>
                        <option value="coach">coach</option>
                        <option value="guest">guest</option>
                    </select>
                    <button type="submit">Log in</button>
                </form>
            </div>
        );
    }
}

export default NameBox;
