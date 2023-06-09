import { AxiosError, AxiosResponse } from "axios";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { Alert, Button, FloatingLabel, Form } from "react-bootstrap";
import { AxiosErrorMessage, ErrorField } from "../../App";
import { BootstrapReboot } from "react-bootstrap-icons";
import axiosHttp from "../../utils/axios";
import "./register-view.css";
import { useNavigate } from "react-router-dom";

interface CaptchaResponse {
  uuid: string;
  captcha_image: string;
}

interface CaptchaInputData extends CaptchaResponse {
  key: string;
  captcha_text: string;
}

interface ErrorMessage {
  showError: boolean;
  error: string | undefined;
}

interface RegisterObject {
  [key: string]: string | number;
}

interface RegisterFormControl {
  key: string;
  type: string;
  placeholder: string;
  value: string;
  error: {
    isInvalid: boolean;
    errorMessage: string;
  };
}

interface RegistrationSuccessful {
  registrationSuccessful: boolean;
  countdownTimer: number;
}

const RegisterView = () => {
  const navigation = useNavigate();

  const [registrationSuccessful, setRegistrationSuccessful] = useState<RegistrationSuccessful>({
    registrationSuccessful: false,
    countdownTimer: 5
  });

  const [errorMessage, setErrorMessage] = useState<ErrorMessage>({
    showError: false,
    error: ""
  });

  const [registeredFormControls, setRegisteredFormControls] = useState<Array<RegisterFormControl>>([
    {
      key: "email",
      type: "email",
      placeholder: "Email",
      value: "",
      error: {
        isInvalid: false,
        errorMessage: "Email can not be empty"
      }
    },
    {
      key: "password",
      type: "password",
      placeholder: "Password",
      value: "",
      error: {
        isInvalid: false,
        errorMessage: "Password can not be empty"
      }
    },
    {
      key: "name",
      type: "email",
      placeholder: "Name",
      value: "",
      error: {
        isInvalid: false,
        errorMessage: "Name can not be empty"
      }
    },
    {
      key: "age",
      type: "email",
      placeholder: "Age",
      value: "",
      error: {
        isInvalid: false,
        errorMessage: "Age must be a number and can not be empty"
      }
    },
    {
      key: "gender",
      type: "select",
      placeholder: "Gender",
      value: "",
      error: {
        isInvalid: false,
        errorMessage: "Please select a gender"
      }
    }
  ]);

  const [captcha, setCaptcha] = useState<CaptchaInputData | null>(null);

  const refreshCaptcha = useCallback(() => {
    axiosHttp.get("/register/captcha").then((captchaResponse: AxiosResponse<CaptchaResponse>) => {
      const responseData = captchaResponse.data;
      const captcha: CaptchaInputData = {
        ...responseData,
        captcha_text: "",
        key: responseData.uuid
      };
      setCaptcha(captcha);
    });
  }, []);

  useEffect(() => {
    if (!captcha) {
      refreshCaptcha();
    }
  }, [captcha, refreshCaptcha]);

  useEffect(() => {
    if (registrationSuccessful.registrationSuccessful) {
      const interval = setInterval(() => {
        if (registrationSuccessful.countdownTimer === 0) {
          navigation("/");
        }
        setRegistrationSuccessful({
          ...registrationSuccessful,
          countdownTimer: registrationSuccessful.countdownTimer - 1
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [navigation, registrationSuccessful]);

  const onChangeCaptchaData = (event: ChangeEvent<HTMLInputElement>): void => {
    if (captcha) {
      const captchaCopy: CaptchaInputData | null = {
        ...captcha
      };
      captchaCopy.captcha_text = event.target.value;
      setCaptcha(captchaCopy);
    }
  };

  const onChangeRegisterData = (event: ChangeEvent<HTMLInputElement>, index: number): void => {
    changeRegisterData(index, event.target.value);
  };

  const onChangeRegisterSelectData = (event: ChangeEvent<HTMLSelectElement>, index: number): void => {
    changeRegisterData(index, event.target.value);
  };

  const changeRegisterData = (index: number, value: string): void => {
    const registeredFormControlsCopy: Array<RegisterFormControl> = [...registeredFormControls];

    let registeredFormControlCopy = registeredFormControlsCopy[index];

    registeredFormControlCopy.value = value;
    if (registeredFormControlCopy.value) {
      registeredFormControlCopy.error.isInvalid = false;
    }

    setRegisteredFormControls(registeredFormControlsCopy);
  };

  const register = () => {
    const axiosRegisterObject: RegisterObject = {};

    registeredFormControls.forEach((registeredFormControl: RegisterFormControl) => {
      const { key, value } = registeredFormControl;

      axiosRegisterObject[key] = Number(value) ? Number(value) : value;
    });

    axiosRegisterObject["captcha_uuid"] = captcha ? captcha.uuid : "";
    axiosRegisterObject["captcha_text"] = captcha ? captcha.captcha_text : "";
    axiosHttp
      .post("/register", axiosRegisterObject)
      .then((response) => {
        if (response.status === 201) {
          setRegistrationSuccessful({
            ...registrationSuccessful,
            registrationSuccessful: true
          });
          errorMessage.showError = false;
          setErrorMessage(errorMessage);
        }
      })
      .catch((error: AxiosError<AxiosErrorMessage>) => {
        const axiosError: AxiosResponse<AxiosErrorMessage> | undefined = error.response;
        if (axiosError) {
          const data = axiosError.data;
          const errorMessageString = data.errorMessage;

          if (errorMessageString) {
            showErrorMessage(errorMessageString);
          }

          const errorFieldArray: Array<ErrorField> | undefined = data.errorFields;
          if (errorFieldArray) {
            const registeredFormControlsCopy: Array<RegisterFormControl> = [...registeredFormControls];
            errorFieldArray.forEach((errorField) => {
              let registeredFormControl = registeredFormControlsCopy.find(
                (registeredFormControl) => registeredFormControl.key === errorField.field
              );
              if (registeredFormControl) {
                let registeredFormControlError = registeredFormControl.error;
                registeredFormControlError.isInvalid = true;
                registeredFormControlError.errorMessage = errorField.errorMessage;
              } else {
                console.error(
                  `Error field for: ${errorField.field} not found with potential error message: ${errorField.errorMessage}`
                );
              }
            });
            setRegisteredFormControls(registeredFormControlsCopy);
          }
        } else {
          showErrorMessage("Something went terribly wrong. Please contact us!");
        }
      });
  };

  const showErrorMessage = (errorMessageString: string): void => {
    errorMessage.showError = true;
    errorMessage.error = errorMessageString;
    setErrorMessage({
      ...errorMessage
    });
  };

  return (
    <>
      <div className="register">
        <div className="register-container">
          <span className="register-heading">Create account</span>

          {registeredFormControls.map((registerFormControl: RegisterFormControl, index: number) => {
            if (registerFormControl.type !== "select") {
              return (
                <FloatingLabel
                  key={registerFormControl.key}
                  controlId={`formBasic${registerFormControl.key}`}
                  label={
                    registerFormControl.error.isInvalid
                      ? registerFormControl.error.errorMessage
                      : registerFormControl.placeholder
                  }
                  className={`mb-3 ${registerFormControl.error.isInvalid ? "register-error" : ""} `}>
                  <Form.Control
                    name={registerFormControl.key}
                    type={registerFormControl.type}
                    placeholder={registerFormControl.placeholder}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => onChangeRegisterData(event, index)}
                    className={registerFormControl.error.isInvalid ? "is-invalid" : ""}
                  />
                </FloatingLabel>
              );
            }

            return (
              <FloatingLabel
                controlId={`formBasic${registerFormControl.key}`}
                label="Gender"
                key={registerFormControl.key}
                className={`mb-3 ${registerFormControl.error.isInvalid ? "register-error" : ""}`}>
                <Form.Select
                  aria-label="Floating label select example"
                  onChange={(event: ChangeEvent<HTMLSelectElement>) => onChangeRegisterSelectData(event, index)}
                  className={registerFormControl.error.isInvalid ? "is-invalid" : ""}>
                  <option value="">Choose an option</option>
                  <option className="register-gender-select" value="MALE">
                    Male
                  </option>
                  <option className="register-gender-select" value="FEMALE">
                    Female
                  </option>
                </Form.Select>
              </FloatingLabel>
            );
          })}

          <div className="captcha mb-3">
            <div className="mb-2">Please enter the captcha code:</div>

            <div className="mb-3">
              <img
                src={captcha?.captcha_image ? `data:image/png;base64, ${captcha?.captcha_image}` : ""}
                width="150px"
                height="50px"
                alt="Captcha"
              />
              <div>
                <BootstrapReboot className="captcha-refresh" size={36} onClick={() => refreshCaptcha()} />
              </div>
            </div>
            <div>
              <Form.Control
                type="text"
                placeholder="Captcha"
                onChange={(event: ChangeEvent<HTMLInputElement>) => onChangeCaptchaData(event)}
              />
            </div>
          </div>

          {registrationSuccessful.registrationSuccessful && (
            <Alert key="success" variant="success">
              Registration was successful. Redirect to login in {registrationSuccessful.countdownTimer} seconds..
            </Alert>
          )}
          {errorMessage.showError && (
            <Alert key="error" variant="danger">
              {errorMessage.error}
            </Alert>
          )}
          <Button onClick={register}>Register</Button>
        </div>
      </div>
    </>
  );
};

export default RegisterView;
