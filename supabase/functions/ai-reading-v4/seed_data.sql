--
-- Seed Data for AI Fortune-telling System
-- Includes samples for reading sentences and tarot combinations.
--

-- Insert Tarot Cards (Sample)
INSERT INTO tarot_cards (card_name, arcana, upright_meaning, reversed_meaning, keywords, element) VALUES
('The Fool', 'Major', 'New beginnings, optimism, trust in life', 'Recklessness, risk-taking, consideration', ARRAY['beginnings', 'innocence', 'spontaneity'], 'Air'),
('The Magician', 'Major', 'Action, power, manifestation', 'Manipulation, poor planning, untapped talents', ARRAY['willpower', 'creation', 'resourcefulness'], 'Air'),
('The High Priestess', 'Major', 'Intuition, mystery, subconscious mind', 'Secrets, disconnected from intuition, withdrawal', ARRAY['intuition', 'sacred knowledge', 'divine feminine'], 'Water'),
('Wheel of Fortune', 'Major', 'Good luck, karma, life cycles', 'Bad luck, resistance to change, breaking cycles', ARRAY['luck', 'karma', 'destiny'], 'Fire');

-- Insert AI Reading Sentences (Demonstrating Topic/Category structure)
-- In a real production, this would be populated with 5000+ entries.
INSERT INTO reading_sentences (category, topic, sentence, weight) VALUES
('personality', '중신강', '당신은 주관이 뚜렷하고 환경에 쉽게 굴하지 않는 강인한 내면을 가지고 있습니다.', 10),
('personality', '중신강', '어떠한 난관이 닥쳐도 스스로의 힘으로 극복해내려는 의지가 매우 강력한 타입입니다.', 10),
('personality', '중신약', '주변 상황에 민감하게 반응하며, 타인의 감정을 세심하게 살피는 배려심이 깊은 성품입니다.', 10),
('personality', '중신약', '독립적으로 일을 추진하기보다는 협력과 조화를 통해 성과를 낼 때 더욱 빛을 발합니다.', 10),
('career', '중신강', '전문직이나 독립적인 사업에서 두각을 나타내며, 리더십을 발휘하는 위치가 어울립니다.', 10),
('money', '재다신약', '재물에 대한 기회는 많으나 그것을 온전히 내 것으로 만드는 데에는 상당한 에너지 소모가 따릅니다.', 10);

-- Insert Tarot Combinations (Sample)
INSERT INTO tarot_combinations (card1, card2, meaning, love, career, money, advice) VALUES
('The Fool', 'Wheel of Fortune', '운명적인 새로운 시작을 의미합니다.', '예상치 못한 인연이 찾아오는 시기입니다.', '과감한 도전이 큰 성취로 이어집니다.', '갑작스러운 횡재수가 있을 수 있습니다.', '주저하지 말고 기회를 잡으세요.'),
('The Magician', 'The High Priestess', '외적인 능력과 내면의 직관이 완벽한 조화를 이룹니다.', '서로의 마음을 깊이 이해하는 관계가 형성됩니다.', '기획력과 직관이 결합되어 사업이 번창합니다.', '지혜로운 투자로 안정적인 수익을 얻습니다.', '내면의 목소리에 더 귀를 기울이세요.');
