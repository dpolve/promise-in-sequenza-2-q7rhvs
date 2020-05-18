import { fromEvent } from "rxjs";
import "./style.css";

/**
 * simula un'attività che impiega del tempo, es. una richiesta http o calcolo
 * in questo caso dopo un ritardo variabile tra 0 e 4 secondi risponde con il
 * valore passato come parametro moltiplicato per 10
 */
function worker(id: number = 0): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    setTimeout(() => {
      try {
        // semplice calcolo
        const result = id * 10;
        console.log("worker(" + id + ") => " + result);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    }, Math.random() * 4000);
  });
}

/**
 * Quando le operazioni devono essere effettuate in sequenza e ne conosciamo
 * a priori il numero, si concatenano esplicitamente le Promise:
 * quella precedente effettua il return del dato, quella successiva si mette
 * dentro la then() della precedente.
 */
function onSerie(): Promise<number[]> {
  const result: number[] = [];

  return worker(1)
    .then(res => {
      console.log("Operation done: ", res);
      result.push(res);
      return worker(2);
    })
    .then(res => {
      console.log("Operation done: ", res);
      result.push(res);
      return worker(3);
    })
    .then(res => {
      console.log("Operation done: ", res);
      result.push(res);
      return worker(4);
    })
    .then(res => {
      console.log("Operation done: ", res);
      result.push(res);
      return result;
    });
}

/**
 * Quando le operazioni devono essere effettuate in sequenza ma non ne conosciamo
 * a priori il numero, ma abbiamo a disposizione un array di operazioni sul quale
 * ciclare, si concatenano le Promise:
 * si cicla sull'array delle operazioni: ad ogni ciclo ci si aggancia alla then()
 * della Promise precedente, al termine si effettua un'unica then().
 */
function onSerieConArray(): Promise<number[]> {
  const result: number[] = [];

  const inputList: number[] = [1, 2, 3, 4];

  let p: Promise<number> = null;
  for (let i = 0; i < inputList.length; i++) {
    if (p == null) {
      p = worker(inputList[i]);
    } else {
      p = p.then(res => {
        console.log("Operation done: ", res);
        result.push(res);
        return worker(inputList[i]);
      });
    }
  }

  return p.then(res => {
    console.log("Operation done: ", res);
    result.push(res);
    return result;
  });
}

/**
 * Quando le operazioni devono essere effettuate in parallelo e ne conosciamo
 * a priori il numero, si costruisce l'array delle Promise risultato e poi
 * vengono passate alla Promise.all()
 */
function onParallelo(): Promise<number[]> {
  const inputList: number[] = [1, 2, 3, 4];

  const promiseList: Promise<number>[] = [];

  for (let i = 0; i < inputList.length; i++) {
    promiseList.push(worker(inputList[i]));
  }

  return Promise.all(promiseList).then(resultList => {
    console.log("Operation done: ", resultList);
    return resultList;
  });
}

/**
 * Gestione click dei pulsanti
 */
// ottiene l'elenco dei button (IMPORTANTE impostare l'id!)
const buttonList: HTMLCollectionOf<
  HTMLButtonElement
> = document.getElementsByTagName("button");

// https://stackoverflow.com/a/22754453
for (let button of buttonList) {
  // per ogni button:
  // 1. recupera l'<id>
  // 2. si registra agli eventi 'click'
  // 3. ad ogni 'click' chiama la funzione 'on<id>()'

  fromEvent(button, "click").subscribe(
    event => {
      console.log("Click on button: " + button.innerText);
      const funcName = "on" + button.id;
      try {
        button.disabled = true;
        eval(funcName + "()")
          .then(res => {
            console.log("Final result: ", res);
            console.log("Completed button: " + button.innerText);
            button.disabled = false;
          })
          .catch(err => {
            console.warn(err);
            button.disabled = false;
          });
      } catch (err) {
        console.warn("Error calling " + funcName + ": " + err);
        button.disabled = false;
      }
    },
    err => {
      console.error("Error on fromEvent(): " + button.innerText);
    }
  );
}
