import { useState, useEffect } from "react";
import { Header } from "../components/header";
import { api } from "../services/api";
import { useAuth } from "../hooks/auth";
import { X } from "lucide-react";
import { toast } from "sonner";
import { NewCreditCard } from "../components/new-credit-card";
import { ConfirmationModal } from "../components/confirmation-modal";
import QRCode from "qrcode";

interface Subscription {
  id: string;
  type: string;
  name: string;
  price: number;
  benefits: string[];
}

export function SubscriptionWarningPage() {
  const { userId, updateToken } = useAuth();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [userCreditCards, setUserCreditCards] = useState<any[]>([]);
  const [subModalOpen, setSubModalOpen] = useState(true);
  const [showCreditCards, setShowCreditCards] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [selectedCreditCard, setSelectedCreditCard] = useState<any | null>(
    null
  );
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [activePaymentMethod, setActivePaymentMethod] = useState<string | null>(
    null
  ); // Estado para controlar qual método de pagamento está ativo

  const openSub = () => {
    setSubModalOpen(true);
  };

  const closeSub = () => {
    setSubModalOpen(false);
  };

  const openPaymentForm = () => {
    setPaymentModalOpen(true);
  };

  const closePaymentForm = () => {
    setPaymentModalOpen(false);
    setShowCreditCards(false);
    setActivePaymentMethod(null);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleConfirmSubscription = () => {
    setIsConfirmationModalOpen(false); // Fecha o modal de confirmação
    if (selectedSubscription) {
      registerUser(selectedSubscription.type); // Registra o usuário com a assinatura selecionada
    }
  };

  const handleCancelSubscription = () => {
    setIsConfirmationModalOpen(false); // Fecha o modal de confirmação
    openPaymentForm(); // Abre novamente o modal de pagamento
  };

  const handleSubscriptionSelection = (subscription: Subscription) => {
    setSelectedSubscription(subscription);

    // Abre o modal de confirmação apenas se houver um cartão de crédito selecionado
    if (selectedCreditCard) {
      setIsConfirmationModalOpen(true);
    } else {
      openPaymentForm();
    }
  };

  const generatePixQrCode = () => {
    const pixUrl = "https://github.com/shuharib0t"; // Seu link para o Pix
    QRCode.toDataURL(pixUrl, { width: 200, margin: 2 }, (err, url) => {
      if (err) {
        console.error("Erro ao gerar QR Code:", err);
      } else {
        setPixQrCode(url);
      }
    });
  };

  function handleCardClick(cardId: string) {
    const selectedCard = userCreditCards.find((card) => card.id === cardId);
    if (selectedCard) {
      setSelectedCreditCard(selectedCard);
    }

    setUserCreditCards((prevCards) =>
      prevCards.map((card) =>
        card.id === cardId
          ? { ...card, selected: true }
          : { ...card, selected: false }
      )
    );

    closePaymentForm();
  }

  async function registerUser(type: string) {
    try {
      const response = await api.post(
        `/subscriptions/select-subscription/${type}`,
        {
          userId: userId,
        }
      );

      const { token } = response.data;

      if (token) {
        updateToken(token);
      }

      window.location.reload();
    } catch (error) {
      console.error("Erro ao registrar o usuário:", error);
    }
  }

  async function fetchUserCreditCards() {
    try {
      const response = await api.get(`/users/${userId}/credit-cards`);
      setUserCreditCards(response.data); // Define os cartões de crédito do usuário
    } catch (error) {
      console.error("Erro ao obter os cartões de crédito do usuário:", error);
    }
  }

  // Dentro do useEffect
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const response = await api.get("/subscriptions");
        setSubscriptions(response.data.subscriptions);
      } catch (error) {
        console.error("Erro ao buscar as assinaturas:", error);
      }
    };

    if (subModalOpen) {
      fetchSubscriptions();
    }

    if (paymentModalOpen) {
      fetchUserCreditCards(); // Chama a função para buscar os cartões de crédito do usuário quando o formulário de pagamento é aberto
    }
  }, [subModalOpen, paymentModalOpen]);

  return (
    <div className="min-h-screen bg-black">
      <Header
        filterMoviesByCategory={function (): void {
          toast.error("Você não é um assinante!");
        }}
      />

      <div className="relative flex justify-center items-center h-[90vh]">
        <div className="text-white text-2xl px-10">
          <h1>Você ainda não é um assinante D:</h1>
          <p>
            Para ter acesso aos filmes você precisa escolher um{" "}
            <button className="text-red-500 hover:underline" onClick={openSub}>
              plano de assinatura
            </button>
          </p>
        </div>
      </div>

      {subModalOpen && (
        <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-75">
          <div className="absolute bg-black border-2 text-white w-[60vw] lg:w-[50vw] p-7 rounded-lg z-10 flex flex-col animate-slide-down">
            <div className="self-end">
              <X
                className="cursor-pointer transition ease-in-out hover:scale-110 duration-300"
                onClick={closeSub}
              />
            </div>

            <div className="flex flex-col">
              <h1 className="text-center text-2xl lg:text-3xl font-bold mb-5">
                Escolha um plano
              </h1>

              <div className="pb-5 md:pr-5 overflow-auto scrollbar-none md:scrollbar-thin scrollbar-thumb-neutral-500 scrollbar-track-transparent">
                <ul className="max-h-[70vh] flex flex-col lg:flex-row gap-10">
                  {subscriptions.map((subscription) => (
                    <li
                      key={subscription.id}
                      className="flex flex-col lg:min-w-[300px] justify-between gap-5 py-5 px-5 border-2 rounded bg-neutral-700 relative"
                    >
                      <div className="flex flex-col gap-2 ">
                        <p className="mb-4 text-xl md:text-2xl text-center break-words">
                          <span className="font-bold text-red-500">
                            {subscription.name}
                          </span>
                          &nbsp;Subscription
                        </p>

                        {subscription.benefits.map((benefit, index) => (
                          <p key={index}>{benefit}</p>
                        ))}
                      </div>

                      <div className="flex flex-col items-center">
                        <p className="text-center">{`R$ ${subscription.price}`}</p>

                        <button
                          className="text-white py-1 px-3 md:py-2  bg-red-800 rounded hover:bg-red-900 transition ease-in-out hover:scale-105 duration-300"
                          onClick={() =>
                            handleSubscriptionSelection(subscription)
                          }
                        >
                          Assinar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {paymentModalOpen && (
        <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-75">
          <div className="absolute bg-black border-2 text-white w-[50vw] lg:w-[40vw] p-2 rounded-lg z-10 flex flex-col animate-slide-down">
            <div className="self-end">
              <X
                className="cursor-pointer transition ease-in-out hover:scale-110 duration-300"
                onClick={closePaymentForm}
              />
            </div>

            <div className="flex flex-col gap-7">
              <h1 className="text-center px-4 text-xl lg:text-2xl font-bold">
                Formas de pagamento
              </h1>

              <div className="flex flex-col mx-5 mb-5 border rounded bg-neutral-800">
                <div className="flex flex-col p-5 md:flex-row gap-5 justify-around">
                  <button
                    className="text-white py-1 md:py-2 md:px-4 bg-red-800 rounded hover:bg-red-900 transition ease-in-out duration-300"
                    onClick={() => {
                      setShowCreditCards(true);
                      setPixQrCode(null);
                      setActivePaymentMethod("creditCard");
                    }}
                  >
                    Cartão de Crédito
                  </button>

                  <button
                    className="text-white py-1 md:py-2 md:px-4 bg-red-800 rounded hover:bg-red-900 transition ease-in-out duration-300"
                    onClick={() => {
                      generatePixQrCode();
                      setShowCreditCards(false);
                      setActivePaymentMethod("pix");
                    }}
                  >
                    Pix
                  </button>
                </div>

                {activePaymentMethod === "creditCard" &&
                  showCreditCards &&
                  userCreditCards.length > 0 && (
                    <ul className="p-5 border bg-neutral-700">
                      {userCreditCards.map((card) => (
                        <li
                          key={card.id}
                          onClick={() => handleCardClick(card.id)}
                          className={`mb-4 text-lg cursor-pointer bg-neutral-900 hover:bg-red-800 rounded p-1 ${
                            card.selected ? "bg-red-900" : ""
                          }`}
                        >
                          **** **** **** {String(card.cardNumber).slice(-4)}
                        </li>
                      ))}

                      <button
                        className="text-white py-1 px-3 md:py-2 md:px-4 bg-red-800 rounded hover:bg-red-900 transition ease-in-out duration-300"
                        onClick={openModal}
                      >
                        Adicionar Cartão
                      </button>
                    </ul>
                  )}

                {activePaymentMethod === "creditCard" &&
                  showCreditCards &&
                  userCreditCards.length === 0 && (
                    <div className="text-center p-5 border-t">
                      <p>
                        Você ainda não possui cartões de crédito cadastrados.
                      </p>
                      <button
                        className="text-white py-1 px-3 md:py-2 md:px-4 mt-4 bg-red-800 rounded hover:bg-red-900 transition ease-in-out hover:scale-105 duration-300"
                        onClick={openModal}
                      >
                        Adicionar Cartão
                      </button>
                    </div>
                  )}

                {activePaymentMethod === "pix" && pixQrCode && (
                  <div className="flex flex-col items-center p-5 border-t">
                    <img src={pixQrCode} alt="Pix QR Code" />
                    <p className="mt-3 text-white">
                      Escaneie o QR Code com a câmera do seu celular para uma
                      surpresa!
                    </p>
                  </div>
                )}

                {isModalOpen && (
                  <div className="fixed top-0 left-0 px-5 w-full h-full flex justify-center items-center bg-black bg-opacity-75 z-50">
                    <div className="bg-black border-2 rounded-lg p-5 relative">
                      <span
                        className="close cursor-pointer text-white absolute top-2 right-2"
                        onClick={closeModal}
                      >
                        <X className="transition ease-in-out hover:scale-110 duration-100" />
                      </span>

                      <NewCreditCard />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedCreditCard && isConfirmationModalOpen && (
        <ConfirmationModal
          message={`Deseja continuar o pagamento da assinatura ${
            selectedSubscription ? String(selectedSubscription.type) : ""
          }  com o cartão **** **** **** ${
            selectedCreditCard
              ? String(selectedCreditCard.cardNumber).slice(-4)
              : ""
          }?`}
          onConfirm={handleConfirmSubscription}
          onCancel={handleCancelSubscription}
        />
      )}
    </div>
  );
}
