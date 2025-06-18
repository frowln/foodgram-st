import {
  Container,
  Input,
  Main,
  Form,
  Button,
  FormTitle,
} from "../../components";
import styles from "./styles.module.css";
import { useFormWithValidation } from "../../utils";
import { AuthContext } from "../../contexts";
import { Redirect } from "react-router-dom";
import { useContext, useState } from "react";
import MetaTags from "react-meta-tags";

const SignIn = ({ onSignIn, submitError, setSubmitError }) => {
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
    onSignIn(values)
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
          <title>Войти на сайт</title>
          <meta
            name="description"
            content="Фудграм - Войти на сайт"
          />
          <meta property="og:title" content="Войти на сайт" />
        </MetaTags>
        <Form
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <FormTitle>Войти</FormTitle>
          {submitError && submitError.submitError && (
            <div className={styles.error}>{submitError.submitError}</div>
          )}
          <Input
            required
            isAuth={true}
            name="email"
            placeholder="Email"
            onChange={onChange}
            error={errors}
          />
          <Input
            required
            isAuth={true}
            type="password"
            name="password"
            placeholder="Пароль"
            error={errors}
            submitError={submitError}
            onChange={onChange}
          />
          {/* <LinkComponent
            className={styles.link}
            href="/reset-password"
            title="Забыли пароль?"
          /> */}
          <Button 
            modifier="style_dark" 
            type="submit" 
            className={styles.button}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Вход...' : 'Войти'}
          </Button>
        </Form>
      </Container>
    </Main>
  );
};

export default SignIn;
