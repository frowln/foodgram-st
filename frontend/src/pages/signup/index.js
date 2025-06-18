import {
  Container,
  Input,
  FormTitle,
  Main,
  Form,
  Button,
} from "../../components";
import styles from "./styles.module.css";
import { useFormWithValidation } from "../../utils";
import { Redirect } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../../contexts";
import MetaTags from "react-meta-tags";

const SignUp = ({ onSignUp, submitError, setSubmitError }) => {
  const { values, handleChange, errors } = useFormWithValidation();
  const authContext = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onChange = (e) => {
    setSubmitError({ submitError: "" });
    handleChange(e);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    onSignUp(values)
      .catch((err) => {
        console.error('Form submission error:', err);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <Main withBG asFlex>
      {authContext && <Redirect to="/recipes" />}
      <Container className={styles.center}>
        <MetaTags>
          <title>Регистрация</title>
          <meta
            name="description"
            content="Фудграм - Регистрация"
          />
          <meta property="og:title" content="Регистрация" />
        </MetaTags>
        <Form
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <FormTitle>Регистрация</FormTitle>
          {submitError && submitError.submitError && (
            <div className={styles.error}>{submitError.submitError}</div>
          )}
          <Input
            placeholder="Имя"
            name="first_name"
            required
            isAuth={true}
            error={errors}
            onChange={onChange}
          />
          <Input
            placeholder="Фамилия"
            name="last_name"
            required
            isAuth={true}
            error={errors}
            onChange={onChange}
          />
          <Input
            placeholder="Имя пользователя"
            name="username"
            required
            isAuth={true}
            error={errors}
            onChange={onChange}
          />
          <Input
            placeholder="Адрес электронной почты"
            name="email"
            required
            isAuth={true}
            error={errors}
            onChange={onChange}
          />
          <Input
            placeholder="Пароль"
            type="password"
            name="password"
            required
            isAuth={true}
            error={errors}
            submitError={submitError}
            onChange={onChange}
          />
          <Button 
            modifier="style_dark" 
            type="submit" 
            className={styles.button}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Создание...' : 'Создать аккаунт'}
          </Button>
        </Form>
      </Container>
    </Main>
  );
};

export default SignUp;
