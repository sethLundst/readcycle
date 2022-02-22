import { Text, View, StyleSheet, TextInput } from "react-native";
import React, { useState } from "react";
import { KeyboardAvoidingView, TouchableOpacity } from "react-native-web";
import validate from "validator";
import { handleSignUp, checkEmail, validateUsername } from "../../db/firestore";

const Login = () => {
	const [userObj, setUserObj] = useState({
		email: "",
		password: "",
		location: {},
		username: "",
	});
	const [isRegistering, setIsRegistering] = useState(false);
	const [emailErr, setEmailErr] = useState("");
	const [pwordErr, setPwordErr] = useState("");
 
	const handleChange = (text, name) => {
		setUserObj((curr) => {
			return { ...curr, [name]: text };
		});
	};

	const validateEmail = async (email) => {
		if (!email) {
			setEmailErr("Please enter an email address");
			return;
		} else if (!validate.isEmail(email)) {
			setEmailErr("Invalid email address.");
			return;
		}
		return checkEmail(email).then((isValid) => {
			return isValid ? setEmailErr("") : setEmailErr("Email address in use.");
		});
	};

	const validatePassword = (pword) => {
		const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{7,20}$/;

		if (!pword) {
			setPwordErr("Please enter a password");
			return;
		}

		if (!regex.test(pword)) {
			setPwordErr(
				"Password must be 7-20 characters long\nwith at least one uppercase letter,\none lowercase letter and one number."
			);
		} else {
			setPwordErr(setPwordErr(false));
		}
	};

	const handleRegisterClick = () => {
		validateEmail(userObj.email)
			.then(() => {
        console.log(pwordErr, emailErr, 1);
				validatePassword(userObj.password);
        console.log(pwordErr, emailErr, 2);
			})
			.then(() => {
				if (!pwordErr && !emailErr) {
					setIsRegistering(true);
				}
			});
	};

	return (
		<View style={styles.container}>
			<View style={styles.headerContainer}>
				<Text style={styles.header}>Readcycle.</Text>
			</View>
			<View style={styles.form}>
				<KeyboardAvoidingView behavior="padding" style={styles.inputContainer}>
					<TextInput
						placeholder="email"
						value={userObj.email}
						type="emailAddress"
						data="email"
						onChangeText={(text) => handleChange(text, "email")}
						style={styles.text_input}
						keyboardType="email-address"></TextInput>
					{emailErr ? <Text style={styles.err_msg}>{emailErr}</Text> : null}
					<TextInput
						placeholder="password"
						value={userObj.password}
						data="password"
						onChangeText={(text) => handleChange(text, "password")}
						style={styles.text_input}
						secureTextEntry></TextInput>
					{pwordErr ? <Text style={styles.err_msg}>{pwordErr}</Text> : null}
				</KeyboardAvoidingView>

				<View style={styles.buttonContainer}>
					<TouchableOpacity style={styles.button}>
						<Text style={styles.buttonText}>Log in.</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.button}
						onPress={() => handleRegisterClick()}>
						<Text style={styles.buttonText}>Register.</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
		height: "70%",
		backgroundColor: "white",
	},
	inputContainer: {
		width: "85%",
	},
	headerContainer: {
		height: "40%",
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},

	header: {
		fontSize: "14vw",
		fontFamily: "courier new",
		fontStyle: "italic",
		fontWeight: "bold",
		color: "deeppink",
		textShadowColor: "midnightblue",
		textShadowOffset: { width: "-1.2vw", height: "-1.2vw" },
	},
	form: {
		width: "90%",
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		alignContent: "center",
		textAlign: "center",
	},
	text_input: {
		textAlign: "center",
		backgroundColor: "azure",
		padding: 8,
		margin: 8,
		borderRadius: 3,
		fontSize: "5vw",

		fontFamily: "Courier",
		color: "midnightblue",
	},
	button: {
		backgroundColor: "azure",
		padding: 10,
		margin: 8,
		borderRadius: 3,
		shadowColor: "midnightblue",
		shadowOffset: { width: "-1.2vw", height: "-1.2vw" },
	},
	buttonContainer: {
		marginTop: 16,
	},
	buttonText: {
		fontFamily: "Courier",
		color: "midnightblue",
		fontWeight: "bold",
		fontSize: "5vw",
	},
	err_msg: {
		fontFamily: "Courier",
		color: "deeppink",
		fontSize: "4vw",
	},
});

export default Login;
