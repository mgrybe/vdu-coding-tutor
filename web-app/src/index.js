import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Problems from './Problems';
import Contact from './Contact';
import Modules from './Modules';
import { CreateModule, EditModule, CopyModule } from './CreateModule';
import {ViewModule} from './ViewModule';
import {ModuleProblem} from './ModuleProblem';
import {CreateProblem, EditProblem, CopyProblem} from './CreateProblem';
import Home from './Home';
import NoPage from './NoPage';
import Layout from './Layout';
import Challenge from './Challenge';
import reportWebVitals from './reportWebVitals';
import { CHAT_WS, CODE_URL, REDIRECT_SING_IN, REDIRECT_SING_OUT } from './Urls';
import { HashRouter, Routes, Route } from "react-router-dom";
import { CreateQuizz, EditQuizz, CopyQuizz } from './CreateQuizz';
import Quizzes from './Quizzes';
import SolveQuizz from './SolveQuizz';
import {CreateContent, EditContent, CopyContent} from './CreateContent';
import Contents from './Contents';
import ViewContent from './ViewContent';

import { Amplify, Auth } from 'aws-amplify';

import { withAuthenticator, Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import { IdTokenProvider } from './IdTokenContext'

import { WebSocketProvider } from './WebSocketContext'

Amplify.configure({
  Auth: {

    // REQUIRED only for Federated Authentication - Amazon Cognito Identity Pool ID
    identityPoolId: 'eu-north-1:d4688ea8-41cd-4ae3-8370-6a4c44b6c83f',

    // REQUIRED - Amazon Cognito Region
    region: 'eu-north-1',

    // OPTIONAL - Amazon Cognito Federated Identity Pool Region 
    // Required only if it's different from Amazon Cognito Region
    identityPoolRegion: 'eu-north-1',

    // OPTIONAL - Amazon Cognito User Pool ID
    userPoolId: 'eu-north-1_tHuWr2ubF',

    // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
    userPoolWebClientId: '4dnoq2sjeu3k0trptc2la43dlj',

    // OPTIONAL - Enforce user authentication prior to accessing AWS resources or not
    mandatorySignIn: true,

    // OPTIONAL - This is used when autoSignIn is enabled for Auth.signUp
    // 'code' is used for Auth.confirmSignUp, 'link' is used for email link verification
    signUpVerificationMethod: 'link', // 'code' | 'link'

    // OPTIONAL - customized storage object
    //storage: MyStorage,

    // OPTIONAL - Manually set the authentication flow type. Default is 'USER_SRP_AUTH'
    //authenticationFlowType: 'USER_PASSWORD_AUTH',

    // OPTIONAL - Manually set key value pairs that can be passed to Cognito Lambda Triggers
    //clientMetadata: { myCustomKey: 'myCustomValue' },

    // OPTIONAL - Hosted UI configuration
    /*oauth: {
      domain: 'vdu-coding-tutor.auth.eu-north-1.amazoncognito.com',
      scope: ['phone', 'email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
      redirectSignIn: 'http://localhost:3000/',
      redirectSignOut: 'http://localhost:3000/',
      responseType: 'token', // or 'code'
      options: {
          AdvancedSecurityDataCollectionFlag : true
      },
      identityProvider: ["Facebook", "Google", "Amazon"],
    }*/
    oauth: {
      domain: 'vdu-coding-tutor.auth.eu-north-1.amazoncognito.com',
      //scope: ['phone', 'email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
      redirectSignIn: REDIRECT_SING_IN, //'http://localhost:3000/',
      redirectSignOut: REDIRECT_SING_OUT, //'http://localhost:3000/',
      responseType: 'token', // or 'code'
      options: {
        AdvancedSecurityDataCollectionFlag: true
      },
      identityProvider: [/*"Facebook",*/ "Google"/*, "Amazon"*/],
    }

    /*oauth: {
        domain: 'your_cognito_domain',
        scope: ['phone', 'email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
        redirectSignIn: 'http://localhost:3000/',
        redirectSignOut: 'http://localhost:3000/',
        responseType: 'token' // or 'token', note that REFRESH token will only be generated when the responseType is code
    }*/
  }
});

class Main extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      code: '',
      challengeId: '',
      name: '',
      idToken: props.user.signInUserSession.idToken
    }

    console.log('user', props.user);
    console.log('signout', props.signOut);

    console.log(props.user.signInUserSession.idToken.jwtToken);
    //const self = this;
    //Auth.currentSession().then(data => self.setState({idToken: data.idToken}));
  }

  componentDidMount() {
    console.log('Main: mounted', this.props);

    Auth.currentSession().then((value) => {
      console.log('yra', value);
    });

    //setInterval(() => this.props.user., 1000);
  }

  render() {
    return (
      <div>
        <IdTokenProvider value={this.state.idToken}>
          <WebSocketProvider url={CHAT_WS + '?idToken=' + this.state.idToken.jwtToken}>
            <HashRouter onUpdate={() => window.scrollTo(0, 0)}>
              <Routes>
                <Route path="/" element={<Layout user={this.state.idToken.payload} /*name={this.props.user.attributes.name}*/ name={this.props.user.signInUserSession.idToken.payload.name} signOut={this.props.signOut} />}>
                  <Route index element={<Home />} />
                  <Route path="home" element={<Home />} />
                  <Route path="problems" element={<Problems />} />
                  <Route path="contact" element={<Contact />} />
                  <Route path="modules" element={<Modules />} />
                  <Route path="quizzes" element={<Quizzes />} />
                  <Route path="content" element={<Contents />} />
                  <Route path="create-problem" element={<CreateProblem />} />
                  <Route path="edit-problem/:editProblemId" element={<EditProblem />} />
                  <Route path="copy-problem/:copyProblemId" element={<CopyProblem />} />
                  <Route path="create-module" element={<CreateModule />} />
                  <Route path="edit-module/:editModuleId" element={<EditModule />} />
                  <Route path="copy-module/:copyModuleId" element={<CopyModule />} />
                  <Route path="view-module/:viewModuleId" element={<ViewModule />} />
                  <Route path="challenge/:challengeId" element={<Challenge />} />
                  <Route path="module-problem/:moduleId/:problemId" element={<ModuleProblem />} />
                  <Route path="create-quizz" element={<CreateQuizz />} />
                  <Route path="edit-quizz/:editQuizzId" element={<EditQuizz />} />
                  <Route path="copy-quizz/:copyQuizzId" element={<CopyQuizz />} />
                  <Route path="solve-quizz/:solveQuizzId" element={<SolveQuizz />} />
                  <Route path="create-content" element={<CreateContent/>} />
                  <Route path="edit-content/:editContentId" element={<EditContent />} />
                  <Route path="copy-content/:copyContentId" element={<CopyContent />} />
                  <Route path="view-content/:viewContentId" element={<ViewContent />} />
                  <Route path="*" element={<NoPage />} />
                </Route>
              </Routes>
            </HashRouter>
          </WebSocketProvider>
        </IdTokenProvider>
      </div>
    )
  }
}

const Site = withAuthenticator(Main);
//const Site = Main;

const formFields = {
  confirmVerifyUser: {
    confirmation_code: {
      label: 'New Label',
      placeholder: 'Enter your Confirmation Code:',
      isRequired: false,
    },
  },
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Authenticator signUpAttributes={['name']} socialProviders={[/*'amazon', 'apple', 'facebook', */'google']}>
    <Site />
  </Authenticator>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();